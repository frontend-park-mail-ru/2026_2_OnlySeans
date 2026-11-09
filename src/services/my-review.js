import { store } from '../core/store.js';
import {
  createReview,
  deleteMyScore,
  deleteReview,
  findMyReview,
  getMyScore,
  setMyScore,
  updateReview,
} from '../api/reviews.js';

let loading = null;

const mine = (filmId) => {
  const state = store.get('myReview');
  return state?.filmId === filmId ? state : null;
};

export const myReview = (filmId) => mine(filmId)?.review ?? null;

export const myScore = (filmId) => mine(filmId)?.score ?? 0;

const remember = (filmId, changes) => {
  const state = { filmId, review: null, score: 0, ...mine(filmId), ...changes };
  if (state.review && 'score' in changes) state.review = { ...state.review, score: changes.score || null };
  store.set({ myReview: state });
};

async function fetchMine(filmId, user) {
  if (!user) return { review: null, score: 0 };
  const [review, score] = await Promise.all([findMyReview(filmId, user.id), getMyScore(filmId)]);
  return { review, score };
}

export function loadMyReview(filmId) {
  const request = { filmId };
  request.promise = fetchMine(filmId, store.get('user')).then((state) => {
    if (loading === request) store.set({ myReview: { filmId, ...state } });
  });
  loading = request;
  return request.promise;
}

async function loaded(filmId) {
  if (loading?.filmId !== filmId) loadMyReview(filmId);
  await loading.promise;
}

export async function setScore(filmId, score) {
  await loaded(filmId);
  await setMyScore(filmId, score);
  remember(filmId, { score });
}

export async function clearScore(filmId) {
  await loaded(filmId);
  if (!myScore(filmId)) return;
  await deleteMyScore(filmId);
  remember(filmId, { score: 0 });
}

export async function saveReview(filmId, values) {
  await loaded(filmId);
  const current = myReview(filmId);
  if (current) {
    remember(filmId, { review: await updateReview(current.id, values, current.version) });
    return;
  }
  await createReview(filmId, values);
  remember(filmId, { review: await findMyReview(filmId, store.get('user').id) });
}

export async function removeReview(filmId) {
  await loaded(filmId);
  const current = myReview(filmId);
  if (!current) return;
  await deleteReview(current.id);
  remember(filmId, { review: null });
}
