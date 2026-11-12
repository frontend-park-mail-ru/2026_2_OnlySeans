import type { Account } from './offline-storage.js';
import { isUnavailable } from '../api/http.js';
import { clearFilmEdit, pendingFilmEdit, queueFilmEdit } from './offline-film-edits.js';
import { store } from '../core/store.js';
import {
  createReview,
  deleteMyScore,
  deleteReview,
  findMyReview,
  getMyScore,
  setMyScore,
  updateReview,
  type Review,
  type ReviewValues,
} from '../api/reviews.js';

let loading: { filmId: number; user: Account | null; promise: Promise<void> } | null = null;

const mine = (filmId: number) => {
  const state = store.get('myReview');
  return state?.filmId === filmId ? state : null;
};

export const myReview = (filmId: number) => mine(filmId)?.review ?? null;

export function myScore(filmId: number) {
  const pending = pendingFilmEdit(filmId, 'score');
  return pending?.kind === 'score' && !pending.conflict ? pending.value : mine(filmId)?.score ?? 0;
}

export function reviewDraft(filmId: number): ReviewValues | null {
  const pending = pendingFilmEdit(filmId, 'review');
  return pending?.kind === 'review' ? pending.values : null;
}

const remember = (filmId: number, changes: { review?: Review | null; score?: number }) => {
  const state = { filmId, review: null, score: 0, ...mine(filmId), ...changes };
  if (state.review && 'score' in changes) state.review = { ...state.review, score: changes.score || null };
  store.set({ myReview: state });
};

async function fetchMine(filmId: number, user: Account | null) {
  if (!user) return { review: null, score: 0 };
  const [review, score] = await Promise.all([findMyReview(filmId, user.id), getMyScore(filmId)]);
  return { review, score };
}

export function loadMyReview(filmId: number) {
  const user = store.get('user');
  const request = { filmId, user, promise: null as Promise<void> };
  request.promise = fetchMine(filmId, user).then((state) => {
    if (loading === request && user === store.get('user')) store.set({ myReview: { filmId, ...state } });
  });
  loading = request;
  return request.promise;
}

async function loaded(filmId: number) {
  if (loading?.filmId !== filmId || loading.user !== store.get('user')) loadMyReview(filmId);
  await loading.promise;
}

export async function setScore(filmId: number, score: number) {
  const pending = pendingFilmEdit(filmId, 'score');
  if (navigator.onLine) {
    try {
      await loaded(filmId);
      if (score) await setMyScore(filmId, score);
      else await deleteMyScore(filmId);
      clearFilmEdit(filmId, 'score', pending?.token);
      remember(filmId, { score });
      return false;
    } catch (error) {
      if (!isUnavailable(error)) throw error;
    }
  }
  queueFilmEdit(filmId, { kind: 'score', value: score });
  remember(filmId, { score });
  return true;
}

export const clearScore = (filmId: number) => setScore(filmId, 0);

export async function saveReview(filmId: number, values: ReviewValues) {
  const pending = pendingFilmEdit(filmId, 'review');
  let current = myReview(filmId);
  if (navigator.onLine) {
    try {
      await loaded(filmId);
      current = myReview(filmId);
      if (current) {
        const review = await updateReview(current.id, values, current.version);
        remember(filmId, { review });
      } else {
        await createReview(filmId, values);
        remember(filmId, { review: await findMyReview(filmId, store.get('user').id) });
      }
      clearFilmEdit(filmId, 'review', pending?.token);
      return false;
    } catch (error) {
      if (!isUnavailable(error)) throw error;
    }
  }
  queueFilmEdit(filmId, { kind: 'review', values, previous: current && { id: current.id, version: current.version } });
  return true;
}

export async function removeReview(filmId: number) {
  const pending = pendingFilmEdit(filmId, 'review');
  let current = myReview(filmId);
  if (navigator.onLine) {
    try {
      await loaded(filmId);
      current = myReview(filmId);
      if (!current) return false;
      await deleteReview(current.id);
      clearFilmEdit(filmId, 'review', pending?.token);
      remember(filmId, { review: null });
      return false;
    } catch (error) {
      if (!isUnavailable(error)) throw error;
    }
  }
  if (!current) return false;
  queueFilmEdit(filmId, { kind: 'delete', previous: { id: current.id, version: current.version } });
  return true;
}
