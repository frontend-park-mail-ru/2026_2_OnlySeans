import { RATING_FIELDS } from './axis-ratings.js';

export const fandomDraftKey = (filmId, user, scope = '') => user ? `frame:fandom-draft:${encodeURIComponent(user.email || String(user.id))}:${filmId}${scope ? `:${scope}` : ''}` : null;
export const readFandomDraft = key => {
  if (!key) return {};
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (!value || typeof value !== 'object') return {};
    const ratings = value.ratings && typeof value.ratings === 'object' ? Object.fromEntries(RATING_FIELDS.filter(({key}) => Number.isInteger(value.ratings[key]) && value.ratings[key] >= 1 && value.ratings[key] <= 10).map(({key}) => [key, value.ratings[key]])) : {};
    return { ...('ratings' in value ? {ratings: Object.keys(ratings).length ? {...ratings, rewatch: value.ratings.rewatch === true} : null} : {}), parent_id: Number.isSafeInteger(value.parent_id) && value.parent_id > 0 ? value.parent_id : null, title: typeof value.title === 'string' ? value.title : '', text: typeof value.text === 'string' ? value.text : '', type: ['theory', 'discussion', 'question'].includes(value.type) ? value.type : 'discussion', spoiler: value.spoiler === true };
  } catch { return {}; }
};
export const saveFandomDraft = (key, draft) => { if (!key) return;try { sessionStorage.setItem(key, JSON.stringify(draft)); } catch { /* Keep the in-memory draft when storage is unavailable. */ } };
export const clearFandomDraft = key => { if (!key) return;try { sessionStorage.removeItem(key); } catch { /* Optional draft persistence. */ } };
