import { IReviewRepository } from '../interfaces/IReviewRepository.js';
import { IProfessionalRepository } from '../../professionals/interfaces/IProfessionalRepository.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../common/errors/index.js';
import { CreateReviewDTO, ReplyReviewDTO } from '../dtos/ReviewDTOs.js';
import { ReviewModel } from '../models/ReviewModel.js';

/**
 * Servicio POO para la lógica de negocio de reseñas y valoraciones.
 */
export class ReviewService {
  private readonly reviewRepository: IReviewRepository;
  private readonly professionalRepository: IProfessionalRepository;

  constructor(
    reviewRepository: IReviewRepository,
    professionalRepository: IProfessionalRepository
  ) {
    this.reviewRepository = reviewRepository;
    this.professionalRepository = professionalRepository;
  }

  public async createReview(clientId: string, dto: CreateReviewDTO): Promise<ReviewModel> {
    const professional = await this.professionalRepository.findById(dto.professionalId);
    if (!professional) {
      throw new NotFoundError('Profesional no encontrado');
    }

    if (professional.userId === clientId) {
      throw new BadRequestError('No podés calificar ni dejar reseñas en tu propio perfil profesional');
    }

    const review = await this.reviewRepository.create({
      clientId,
      professionalId: dto.professionalId,
      rating: dto.rating,
      serviceType: dto.serviceType,
      comment: dto.comment,
      isVerifiedVisit: dto.isVerifiedVisit
    });

    // Actualiza automáticamente el promedio y desglose de estrellas del profesional
    await this.professionalRepository.recalculateRatings(dto.professionalId);

    return review;
  }

  public async getReviewsByProfessional(professionalId: string, limit = 20, offset = 0): Promise<ReviewModel[]> {
    return this.reviewRepository.findByProfessionalId(professionalId, limit, offset);
  }

  public async replyToReview(
    reviewId: string,
    currentUserId: string,
    dto: ReplyReviewDTO
  ): Promise<ReviewModel> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Reseña no encontrada');
    }

    const professional = await this.professionalRepository.findById(review.professionalId);
    if (!professional || professional.userId !== currentUserId) {
      throw new ForbiddenError('Solo el profesional evaluado puede responder a esta reseña');
    }

    const updated = await this.reviewRepository.update(reviewId, {
      professionalReply: dto.reply,
      repliedAt: new Date()
    });

    return updated!;
  }
}
