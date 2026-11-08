import { request } from './http.js';

const id = encodeURIComponent;

const PAGE = 50;

export async function getAudienceRating(filmId) {
  const { ratings } = await request(`/films/${id(filmId)}/fandom`);
  return { average: ratings?.overall || 0, count: ratings?.overall_count || 0 };
}

export async function getMyRating(filmId, userId) {
  for (let offset = 0; ; offset += PAGE) {
    const data = await request(`/films/${id(filmId)}/comments`, {
      params: { limit: PAGE, offset, sort: 'new' },
    });
    const mine = data.comments.find(
      (comment) => comment.author?.id === userId && !comment.deleted && comment.ratings?.overall,
    );
    if (mine) return { id: mine.id, value: mine.ratings.overall };
    if (offset + PAGE >= data.roots_total) return null;
  }
}

export async function saveRating(filmId, value, ratingId) {
  const body = { ratings: { overall: value } };
  const { comment } = ratingId
    ? await request(`/comments/${id(ratingId)}`, { method: 'PATCH', body })
    : await request(`/films/${id(filmId)}/comments`, {
        method: 'POST',
        body: { ...body, text: '', spoiler: false },
      });
  return { id: comment.id, value: comment.ratings.overall };
}

export const deleteRating = (ratingId) =>
  request(`/comments/${id(ratingId)}`, { method: 'DELETE' });
