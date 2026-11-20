
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfessionalRepository } from '../../modules/professionals/repositories/ProfessionalRepository.js';
import { ProfessionalProfileModel } from '../../modules/professionals/models/ProfessionalProfileModel.js';
import { ReviewModel } from '../../modules/reviews/models/ReviewModel.js';

// Simulamos las operaciones de Sequelize.
vi.mock('../../modules/reviews/models/ReviewModel.js', () => ({
    ReviewModel: {
        findAll: vi.fn()
    }
}));

vi.mock('../../modules/professionals/models/ProfessionalProfileModel.js', () => ({
    ProfessionalProfileModel: {
        update: vi.fn()
    }
}));

describe('ProfessionalRepository - recalculateRatings', () => {
    const professionalId = 'professional-1';

    let repository: ProfessionalRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        repository = new ProfessionalRepository();
    });

    //  Profesional sin reseñas
    it('establece rating null y contadores en cero cuando no hay reseñas', async () => {
        vi.mocked(ReviewModel.findAll).mockResolvedValue([]);

        await repository.recalculateRatings(professionalId);

        // Comprueba que se consulten las reseñas del profesional.
        expect(ReviewModel.findAll).toHaveBeenCalledWith({
        where: { professionalId },
        attributes: ['rating']
        });

        // Comprueba los valores que se guardarán.
        expect(ProfessionalProfileModel.update).toHaveBeenCalledWith(
        {
            ratingAverage: null,
            totalReviews: 0,
            fiveStarCount: 0,
            fourStarCount: 0,
            threeStarCount: 0,
            twoStarCount: 0,
            oneStarCount: 0
        },
        { where: { id: professionalId } }
        );

        expect(ProfessionalProfileModel.update)
        .toHaveBeenCalledTimes(1);
    });

    // Profesional con varias reseñas
    it('calcula correctamente el promedio y la distribución de estrellas', async () => {
        const reviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
        { rating: 2 },
        { rating: 1 }
        ];

        vi.mocked(ReviewModel.findAll).mockResolvedValue(
        reviews as ReviewModel[]
        );

        await repository.recalculateRatings(professionalId);

        // Promedio: (5 + 5 + 4 + 3 + 2 + 1) / 6 = 3.333...
        // Redondeado a dos decimales: 3.33

        expect(ProfessionalProfileModel.update).toHaveBeenCalledWith(
        {
            ratingAverage: 3.33,
            totalReviews: 6,
            fiveStarCount: 2,
            fourStarCount: 1,
            threeStarCount: 1,
            twoStarCount: 1,
            oneStarCount: 1
        },
        { where: { id: professionalId } }
        );

        expect(ProfessionalProfileModel.update)
        .toHaveBeenCalledTimes(1);
    });
    });
