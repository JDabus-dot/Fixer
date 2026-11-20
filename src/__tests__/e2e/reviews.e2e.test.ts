
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { App } from '../../app.js';
import { DatabaseConnection } from '../../database/DatabaseConnection.js';
import { ModelRegistry } from '../../database/ModelRegistry.js';

describe('E2E - Flujo completo de reseñas', () => {
    const db = DatabaseConnection.getInstance();
    const app = new App().app;

    const API = '/api/v1';

    beforeAll(async () => {
        await db.authenticate();
        ModelRegistry.initModels(db.getSequelize());
    });

    afterAll(async () => {
        await db.close();
    });

    it('permite contratar, calificar y responder una reseña', async () => {
        const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const password = 'Test123456!';

        // 1. Registrar profesional

        const professionalData = {
            fullName: 'Profesional E2E',
            email: `profesional.e2e.${uniqueId}@example.com`,
            phone: '2915551234',
            password,
            securityQuestion: 'Nombre de tu mascota',
            securityAnswer: 'Firulais',
            isPro: true,
            tradeCategory: 'Plomería'
        };

        const registerProfessional = await request(app)
            .post(`${API}/auth/register`)
            .send(professionalData);

        expect(registerProfessional.status).toBe(201);
        expect(registerProfessional.body.data.user.role).toBe('PROFESSIONAL');

        const professionalToken = registerProfessional.body.data.token;
        const professionalUserId = registerProfessional.body.data.user.id;

        expect(professionalToken).toBeTruthy();
        expect(professionalUserId).toBeTruthy();

        // 2. Obtener perfil profesional

        const profileResponse = await request(app)
            .get(`${API}/professionals/me`)
            .set('Authorization', `Bearer ${professionalToken}`);

        expect(profileResponse.status).toBe(200);

        const professionalId = profileResponse.body.data.id;

        expect(professionalId).toBeTruthy();
        expect(profileResponse.body.data.userId).toBe(professionalUserId);

        // 3. Registrar cliente

        const clientData = {
            fullName: 'Cliente E2E',
            email: `cliente.e2e.${uniqueId}@example.com`,
            phone: '2915555678',
            password,
            securityQuestion: 'Nombre de tu mascota',
            securityAnswer: 'Firulais',
            isPro: false
        };

        const registerClient = await request(app)
            .post(`${API}/auth/register`)
            .send(clientData);

        expect(registerClient.status).toBe(201);
        expect(registerClient.body.data.user.role).toBe('CLIENT');

        const clientId = registerClient.body.data.user.id;

        expect(clientId).toBeTruthy();

        // 4. Iniciar sesión como cliente

        const loginClient = await request(app)
            .post(`${API}/auth/login`)
            .send({
                email: clientData.email,
                password
            });

        expect(loginClient.status).toBe(200);
        expect(loginClient.body.data.user.id).toBe(clientId);

        const clientToken = loginClient.body.data.token;

        expect(clientToken).toBeTruthy();

        // 5. Buscar al profesional

        const searchResponse = await request(app)
            .get(`${API}/professionals`)
            .query({
                category: 'Plomería',
                limit: 100
            });

        expect(searchResponse.status).toBe(200);

        const professionals = searchResponse.body.data;

        expect(Array.isArray(professionals)).toBe(true);

        const foundProfessional = professionals.find(
            (professional: { id: string }) =>
                professional.id === professionalId
        );

        expect(foundProfessional).toBeDefined();

        // 6. Crear solicitud de servicio

        const createRequest = await request(app)
            .post(`${API}/service-requests`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                professionalId,
                title: 'Reparación de cañería',
                description: 'Necesito reparar una pérdida de agua en la cocina.',
                category: 'Plomería',
                serviceAddress: 'Calle Falsa 123',
                zone: 'Centro',
                isUrgent: false
            });

        expect(createRequest.status).toBe(201);

        const serviceRequestId = createRequest.body.data.id;

        expect(serviceRequestId).toBeTruthy();
        expect(createRequest.body.data.clientId).toBe(clientId);
        expect(createRequest.body.data.professionalId).toBe(professionalId);

        // 7. Profesional acepta la solicitud

        const acceptedRequest = await request(app)
            .patch(`${API}/service-requests/${serviceRequestId}/status`)
            .set('Authorization', `Bearer ${professionalToken}`)
            .send({
                status: 'ACCEPTED'
            });

        expect(acceptedRequest.status).toBe(200);
        expect(acceptedRequest.body.data.status).toBe('ACCEPTED');

        // 8. Profesional inicia el trabajo

        const inProgressRequest = await request(app)
            .patch(`${API}/service-requests/${serviceRequestId}/status`)
            .set('Authorization', `Bearer ${professionalToken}`)
            .send({
                status: 'IN_PROGRESS'
            });

        expect(inProgressRequest.status).toBe(200);
        expect(inProgressRequest.body.data.status).toBe('IN_PROGRESS');

        // 9. Profesional completa el servicio

        const completedRequest = await request(app)
            .patch(`${API}/service-requests/${serviceRequestId}/status`)
            .set('Authorization', `Bearer ${professionalToken}`)
            .send({
                status: 'COMPLETED'
            });

        expect(completedRequest.status).toBe(200);
        expect(completedRequest.body.data.status).toBe('COMPLETED');

        // 10. Cliente publica una reseña

        const createReview = await request(app)
            .post(`${API}/reviews`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                professionalId,
                rating: 4,
                serviceType: 'Plomería',
                comment: 'Excelente atención y muy buen trabajo realizado.',
                isVerifiedVisit: true
            });

        expect(createReview.status).toBe(201);

        const reviewId = createReview.body.data.id;

        expect(reviewId).toBeTruthy();
        expect(createReview.body.data.clientId).toBe(clientId);
        expect(createReview.body.data.professionalId).toBe(professionalId);
        expect(createReview.body.data.rating).toBe(4);

        // 11. Profesional inicia sesión

        const loginProfessional = await request(app)
            .post(`${API}/auth/login`)
            .send({
                email: professionalData.email,
                password
            });

        expect(loginProfessional.status).toBe(200);
        expect(loginProfessional.body.data.user.id).toBe(professionalUserId);

        const loggedProfessionalToken = loginProfessional.body.data.token;

        expect(loggedProfessionalToken).toBeTruthy();

        // 12. Profesional responde la reseña

        const replyText = 'Muchas gracias por confiar en mi trabajo.';

        const replyResponse = await request(app)
            .patch(`${API}/reviews/${reviewId}/reply`)
            .set('Authorization', `Bearer ${loggedProfessionalToken}`)
            .send({
                reply: replyText
            });

        expect(replyResponse.status).toBe(200);
        expect(replyResponse.body.data.professionalReply).toBe(replyText);
        expect(replyResponse.body.data.repliedAt).toBeTruthy();

        // 13. Consultar las reseñas para verificar persistencia

        const reviewsResponse = await request(app)
            .get(`${API}/reviews/professional/${professionalId}`);

        expect(reviewsResponse.status).toBe(200);

        const reviews = reviewsResponse.body.data;

        expect(Array.isArray(reviews)).toBe(true);

        const savedReview = reviews.find(
            (review: { id: string }) => review.id === reviewId
        );

        expect(savedReview).toBeDefined();
        expect(savedReview.rating).toBe(4);
        expect(savedReview.professionalReply).toBe(replyText);
        expect(savedReview.repliedAt).toBeTruthy();
    });
});
