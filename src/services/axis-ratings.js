import { store } from '../modules/store.js';

// Оси оценки отзыва. Сами оценки хранятся на сервере в отзыве (поле ratings у корневого комментария).
export const RATING_AXES = [
  { key: 'plot', label: 'Сюжет' },
  { key: 'visual', label: 'Визуал' },
  { key: 'acting', label: 'Актёры' },
  { key: 'music', label: 'Музыка' },
];

// Общая оценка задаётся независимо от четырёх осей розы.
export const RATING_FIELDS = [{ key: 'overall', label: 'Общая оценка' }, ...RATING_AXES];

// Раньше отзыв по осям хранился только в браузере. Эти данные подставляются в форму нового отзыва
// один раз и удаляются после публикации.
const identity = user => user?.email?.toLowerCase() || (user?.id ? String(user.id) : null);
const keyFor = () => { const id = identity(store.get('user'));return id ? `frame:axis-ratings:${encodeURIComponent(id)}` : null; };
const validScore = value => Number.isInteger(value) && value >= 1 && value <= 10;

const readAll = () => {
  const key = keyFor();if (!key) return {};
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
};

export const readLegacyReview = filmId => {
  const value = readAll()[filmId];
  if (!value || typeof value !== 'object') return {};
  const ratings = Object.fromEntries(RATING_FIELDS.filter(({ key }) => validScore(value[key])).map(({ key }) => [key, value[key]]));
  const text = typeof value.text === 'string' ? value.text.slice(0, 2000) : '';
  if (!Object.keys(ratings).length && !text.trim()) return {};
  return { text, spoiler: value.spoiler === true, ratings: Object.keys(ratings).length ? { ...ratings, rewatch: value.rewatch === true } : null };
};

export const clearLegacyReview = filmId => {
  const key = keyFor();if (!key) return;
  const all = readAll();if (!(filmId in all)) return;
  delete all[filmId];
  try { localStorage.setItem(key, JSON.stringify(all)); } catch { /* Старый черновик просто останется. */ }
};
