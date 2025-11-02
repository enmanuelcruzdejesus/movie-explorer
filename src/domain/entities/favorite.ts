export type Favorite = {
  id: string;           // ULID/UUID (ULID recommended for time-ordered SK)
  userId: string;       // Auth0 sub
  movieId: string;

  title?: string;
  year?: number;
  genres?: string[];
  posterUrl?: string;
  notes?: string | null;
  rating?: number | null;

  createdAt: string;    // ISO
  updatedAt: string;    // ISO
};

/** Internal single-table item shape */
export type FavoriteItem = {
  PK: string;               // USER#{sub}
  SK: string;               // FAV#{id}
  Type: "FAVORITE";
  // GSI to dedupe by (user, movieId)
  GSI1PK: string;           // USER#{sub}#MOVIE
  GSI1SK: string;           // {movieId}

  id: string;
  userId: string;
  movieId: string;

  title?: string;
  year?: number;
  genres?: string[];
  posterUrl?: string;
  notes?: string | null;
  rating?: number | null;

  createdAt: string;
  updatedAt: string;
};

export const Key = {
  userPK: (userId: string) => `USER#${userId}`,
  favSK:  (id: string)      => `FAV#${id}`,
  gsi1PK: (userId: string)  => `USER#${userId}#MOVIE`,
  uqPK:   (userId: string)  => `UQ#USER#${userId}#MOVIE`,
  uqSK:   (movieId: string) => `MOVIE#${movieId}`,
};

export function toItem(fav: Favorite): FavoriteItem {
  return {
    PK: Key.userPK(fav.userId),
    SK: Key.favSK(fav.id),
    Type: "FAVORITE",
    GSI1PK: Key.gsi1PK(fav.userId),
    GSI1SK: fav.movieId,
    ...fav,
  };
}

export function fromItem(item: FavoriteItem): Favorite {
  const {
    id, userId, movieId, title, year, genres, posterUrl, notes, rating, createdAt, updatedAt,
  } = item;
  return { id, userId, movieId, title, year, genres, posterUrl, notes, rating, createdAt, updatedAt };
}
