// src/domain/services/FavoritesService.ts
import { ulid } from 'ulid'
import type {
  CreateFavoriteInput,
  UpdateFavoriteInput,
  ListOptions,
  ListResult,
  FavoritesRepository,
} from '../repositories/favoritesRepository'
import type { Favorite } from '../entities/favorite'
import ApiError from '../../controllers/error.controller'

export type FavoritesServiceOptions = {
  /** Soft cap per user */
  maxPerUser?: number
}

export class FavoritesService {
  private readonly repo: FavoritesRepository
  private readonly maxPerUser: number

  constructor(repo: FavoritesRepository, opts: FavoritesServiceOptions = {}) {
    this.repo = repo
    this.maxPerUser = opts.maxPerUser ?? 1000
  }

  async list(userId: string, opts?: ListOptions): Promise<ListResult> {
    return this.repo.listByUser(userId, opts)
  }

  async get(userId: string, id: string): Promise<Favorite> {
    const found = await this.repo.getById(userId, id)
    if (!found) throw ApiError.notFound('Favorite not found')
    return found
  }

  async add(userId: string, data: CreateFavoriteInput): Promise<Favorite> {
    if (!data.movieId?.trim()) {
      throw ApiError.validationError('movieId is required')
    }

    // Soft limit per user
    if (this.repo.countByUser) {
      const count = await this.repo.countByUser(userId)
      if (count >= this.maxPerUser) {
        throw ApiError.validationError(`Favorites limit reached (${this.maxPerUser})`)
      }
    }

    // Fast pre-check (still race-safe thanks to transactional unique marker)
    const exists = await this.repo.existsByMovieId(userId, data.movieId)
    if (exists) {
      throw ApiError.validationError('Movie already in favorites')
    }

    const id = ulid()
    const now = new Date().toISOString()

    try {
      return await this.repo.create(userId, id, now, data)
    } catch (err: any) {
      const msg = String(err?.message ?? '')
      const name = String(err?.name ?? '')
      // If two requests race, DynamoDB transaction/conditions will raise an error
      if (
        msg.includes('ConditionalCheckFailed') ||
        msg.includes('TransactionCanceled') ||
        name === 'TransactionCanceledException'
      ) {
        throw ApiError.validationError('Movie already in favorites')
      }
      throw err
    }
  }

  async update(userId: string, id: string, patch: UpdateFavoriteInput): Promise<Favorite> {
    // movieId is immutable
    if (Object.prototype.hasOwnProperty.call(patch as any, 'movieId')) {
      throw ApiError.validationError('movieId cannot be updated')
    }
    const now = new Date().toISOString()
    const updated = await this.repo.update(userId, id, now, patch)
    if (!updated) throw ApiError.notFound('Favorite not found')
    return updated
  }

  async remove(userId: string, id: string): Promise<void> {
    const ok = await this.repo.delete(userId, id)
    if (!ok) throw ApiError.notFound('Favorite not found')
  }
}
