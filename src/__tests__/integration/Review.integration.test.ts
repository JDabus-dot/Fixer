
import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';

import { ReviewRouter } from '../../modules/reviews/routes/ReviewRouter.js';
import { ReviewController } from '../../modules/reviews/controllers/ReviewController.js';
import { ReviewService } from '../../modules/reviews/services/ReviewService.js';

import type { IReviewRepository } from '../../modules/reviews/interfaces/IReviewRepository.js';
import type { IProfessionalRepository } from '../../modules/professionals/interfaces/IProfessionalRepository.js';

import { professionalIdFixture,reviewsFixture } from '../fixtures/review.fixture.js';

describe('GET /api/v1/reviews/professional/:professionalId', () => {

    const crearAplicacion = (reviews: typeof reviewsFixture) => {
        const reviewRepository = {
        findByProfessionalId: vi.fn().mockResolvedValue(reviews)
        } as unknown as IReviewRepository;

        const professionalRepository = {} as IProfessionalRepository;

        const service = new ReviewService(
        reviewRepository,
        professionalRepository
        );

        const controller = new ReviewController(service);
        const router = new ReviewRouter(controller);

        const app = express();
        app.use(express.json());
        app.use('/api/v1/reviews', router.getRouter());

        return {
        app,
        reviewRepository
        };
    };

    it('debe devolver las reseñas del profesional', async () => {
        const { app, reviewRepository } = crearAplicacion(reviewsFixture);

        const response = await request(app)
        .get(`/api/v1/reviews/professional/${professionalIdFixture}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data[0].rating).toBe(5);
        expect(response.body.data[1].rating).toBe(4);

        expect(reviewRepository.findByProfessionalId)
        .toHaveBeenCalledWith(professionalIdFixture, 20, 0);
    });

    it('debe devolver una lista vacía si no existen reseñas', async () => {
        const { app } = crearAplicacion([]);

        const response = await request(app)
        .get(`/api/v1/reviews/professional/${professionalIdFixture}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });

});
