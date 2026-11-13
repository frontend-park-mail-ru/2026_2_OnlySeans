import { fetchCurrentUser } from '../api/auth.js';
import { errorMessage } from '../api/errors.js';
import { ApiError, isUnavailable } from '../api/http.js';
import {
  createReview, deleteMyScore, deleteReview, findMyReview, setMyScore, updateReview,
  type ReviewValues,
} from '../api/reviews.js';
import { store } from '../core/store.js';
import { notify } from './notice.js';
import { offlineAccount, offlineKeys, privateKey, readOffline, removeOffline, writeOffline } from './offline-storage.js';

type PreviousReview = { id: number; version: number };
type FilmEdit =
  | { kind: 'score'; value: number }
  | { kind: 'review'; values: ReviewValues; previous?: PreviousReview }
  | { kind: 'delete'; previous: PreviousReview };

type PendingEdit = FilmEdit & { filmId: number; token: string; conflict?: boolean };

function editKey(accountId: number, filmId: number, kind: 'score' | 'review') {
  return privateKey(accountId, 'edit:' + filmId + ':' + kind);
}

export function pendingFilmEdit(filmId: number, kind: 'score' | 'review') {
  const account = store.get('user');
  return account && offlineAccount()?.id === account.id
    ? readOffline<PendingEdit>(editKey(account.id, filmId, kind))
    : undefined;
}

export function queueFilmEdit(filmId: number, edit: FilmEdit) {
  const account = store.get('user');
  if (!account || offlineAccount()?.id !== account.id) throw new Error('Для работы офлайн сначала войдите.');
  const key = editKey(account.id, filmId, edit.kind === 'score' ? 'score' : 'review');
  if (!writeOffline(key, { ...edit, filmId, token: crypto.randomUUID() })) {
    throw new Error('Браузер не смог сохранить изменение.');
  }
}

export function clearFilmEdit(filmId: number, kind: 'score' | 'review', token?: string) {
  const account = store.get('user');
  if (token && account && pendingFilmEdit(filmId, kind)?.token === token) {
    removeOffline(editKey(account.id, filmId, kind));
  }
}

async function applyEdit(edit: PendingEdit, accountId: number) {
  if (edit.kind === 'score') {
    if (edit.value) await setMyScore(edit.filmId, edit.value);
    else await deleteMyScore(edit.filmId).catch(error => {
      if (!(error instanceof ApiError && error.status === 404)) throw error;
    });
    return;
  }

  const current = await findMyReview(edit.filmId, accountId, { fresh: true });
  if (edit.kind === 'delete' && !current) return;
  if (edit.kind === 'review' && current &&
      current.title === edit.values.title && current.text === edit.values.text &&
      current.spoiler === edit.values.spoiler) return;

  const previous = edit.previous;
  if (current?.id !== previous?.id || current?.version !== previous?.version) {
    throw new ApiError(409, 'review was changed by someone else, reload it');
  }
  if (edit.kind === 'delete') await deleteReview(edit.previous.id);
  else if (previous) await updateReview(previous.id, edit.values, previous.version);
  else await createReview(edit.filmId, edit.values);
}

async function sendPendingEdits() {
  if (!navigator.onLine) return false;
  const account = store.get('user');
  if (!account || offlineAccount()?.id !== account.id) return false;
  const keys = offlineKeys(privateKey(account.id, 'edit:'));
  if (!keys.length || (await fetchCurrentUser())?.id !== account.id) return false;

  let changed = false;
  for (const key of keys) {
    if (offlineAccount()?.id !== account.id || store.get('user')?.id !== account.id) break;
    const edit = readOffline<PendingEdit>(key);
    if (!edit || edit.conflict) continue;
    try {
      await applyEdit(edit, account.id);
      if (readOffline<PendingEdit>(key)?.token === edit.token) removeOffline(key);
      changed = true;
    } catch (error) {
      if (isUnavailable(error) || !(error instanceof ApiError) || error.status >= 500 || error.status === 401) break;
      if (readOffline<PendingEdit>(key)?.token === edit.token) writeOffline(key, { ...edit, conflict: true });
      notify('Не удалось отправить изменение из офлайна. ' + errorMessage(error), { type: 'error' });
    }
  }
  if (changed) notify('Изменения из офлайна отправлены.', { type: 'success' });
  return changed;
}

let syncing: Promise<boolean> | undefined;

export function syncFilmEdits(): Promise<boolean> {
  syncing ??= Promise.resolve(navigator.locks
    ? navigator.locks.request('frame:film-edits', sendPendingEdits)
    : sendPendingEdits())
    .catch(() => false)
    .finally(() => { syncing = undefined; });
  return syncing;
}
