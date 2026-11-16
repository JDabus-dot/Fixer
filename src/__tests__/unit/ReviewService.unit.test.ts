
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReviewService } from '../../modules/reviews/services/ReviewService.js';
import type { IReviewRepository } from '../../modules/reviews/interfaces/IReviewRepository.js';
import type { IProfessionalRepository } from '../../modules/professionals/interfaces/IProfessionalRepository.js';

import {
    BadRequestError,
    ForbiddenError,
    NotFoundError
} from '../../common/errors/index.js';

describe('ReviewService - Tests unitarios', () => {
    const professionalId = 'professional-1';
    const clientId = 'client-1';
    const ownerId = 'owner-1';
    const reviewId = 'review-1';

    const dto = {
        professionalId,
        rating: 4,
        serviceType: 'Plomería',
        comment: 'El trabajo se realizó correctamente.',
        isVerifiedVisit: true
    };

    const professional = {
        id: professionalId,
        userId: ownerId
    };

    const review = {
        id: reviewId,
        clientId,
        ...dto
    };

    let reviewRepository: {
        create: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
    };

    let professionalRepository: {
        findById: ReturnType<typeof vi.fn>;
        recalculateRatings: ReturnType<typeof vi.fn>;
    };

    let service: ReviewService;

beforeEach(() => {
    reviewRepository = {
        create: vi.fn().mockResolvedValue(review),
        findById: vi.fn().mockResolvedValue(review),
        update: vi.fn().mockResolvedValue(review)
    };

    professionalRepository = {
        findById: vi.fn().mockResolvedValue(professional),
        recalculateRatings: vi.fn().mockResolvedValue(undefined)
    };

    service = new ReviewService(
        reviewRepository as unknown as IReviewRepository,
        professionalRepository as unknown as IProfessionalRepository
        );
    });

describe('createReview', () => {
    it('crea una reseña y recalcula las calificaciones', async () => {
        const result = await service.createReview(clientId, dto);

        expect(reviewRepository.create).toHaveBeenCalledWith({
            clientId,
            ...dto
        });

        expect(professionalRepository.recalculateRatings)
            .toHaveBeenCalledWith(professionalId);

        expect(reviewRepository.create).toHaveBeenCalledTimes(1);
        expect(professionalRepository.recalculateRatings)
            .toHaveBeenCalledTimes(1);

      // El recálculo debe ejecutarse después de crear la reseña.
        expect(
            reviewRepository.create.mock.invocationCallOrder[0]
        ).toBeLessThan(
            professionalRepository.recalculateRatings.mock.invocationCallOrder[0]
        );

        expect(result).toBe(review);
    });

    it('rechaza una reseña si el profesional no existe', async () => {
        professionalRepository.findById.mockResolvedValue(null);

        await expect(
            service.createReview(clientId, dto)
        ).rejects.toBeInstanceOf(NotFoundError);

        expect(reviewRepository.create).not.toHaveBeenCalled();
        expect(professionalRepository.recalculateRatings)
            .not.toHaveBeenCalled();
    });

    it('impide que un profesional se califique a sí mismo', async () => {
        await expect(
            service.createReview(ownerId, dto)
        ).rejects.toBeInstanceOf(BadRequestError);

        expect(reviewRepository.create).not.toHaveBeenCalled();
        expect(professionalRepository.recalculateRatings)
            .not.toHaveBeenCalled();
        });
    });

describe('replyToReview', () => {
    it('permite al profesional evaluado responder su reseña', async () => {
        const reply = 'Gracias por tu opinión';

        const result = await service.replyToReview(
            reviewId,
            ownerId,
            { reply }
        );

        expect(reviewRepository.update).toHaveBeenCalledWith(
            reviewId,
            {
            professionalReply: reply,
            repliedAt: expect.any(Date)
            }
        );

        expect(reviewRepository.update).toHaveBeenCalledTimes(1);
        expect(result).toBe(review);
    });

    it('impide responder a un usuario que no es dueño del perfil', async () => {
        await expect(
            service.replyToReview(reviewId, 'other-user', {
            reply: 'Gracias'
            })
        ).rejects.toBeInstanceOf(ForbiddenError);

        expect(reviewRepository.update).not.toHaveBeenCalled();
    });

    it('rechaza responder una reseña inexistente', async () => {
        reviewRepository.findById.mockResolvedValue(null);

        await expect(
            service.replyToReview('missing-review', ownerId, {
            reply: 'Gracias'
            })
        ).rejects.toBeInstanceOf(NotFoundError);

        expect(professionalRepository.findById)
            .not.toHaveBeenCalled();

        expect(reviewRepository.update).not.toHaveBeenCalled();
        });
    });
});
