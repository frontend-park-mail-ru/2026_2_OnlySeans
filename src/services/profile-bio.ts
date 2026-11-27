import { store } from '../core/store.js';
import { readJson, writeJson } from './storage.js';
const key = () => `frame:profile-bio:${store.get('user')?.id ?? 'guest'}`;
/** Читает описание текущего аккаунта на устройстве; серверного поля биографии пока нет. */
export function readProfileBio() {
  if (!store.get('user')) return '';
  const value = readJson<unknown>(key(), '');
  return typeof value === 'string' && [...value].length <= 160 ? value : '';
}
export function saveProfileBio(value: string) {
  if (!store.get('user')) throw new Error('Войдите, чтобы изменить описание');
  if ([...value.trim()].length > 160)
    throw new Error('Описание должно быть не длиннее 160 символов');
  if (!writeJson(key(), value.trim()))
    throw new Error('Не удалось сохранить описание на устройстве');
}

/** Любимые жанры профиля сохраняются отдельно для каждого аккаунта на устройстве. */
export function readProfileGenres(): string[] {
  if (!store.get('user')) return [];
  const value = readJson<unknown>(key() + ':genres', []);
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (genre): genre is string =>
              typeof genre === 'string' && genre.trim().length > 0 && genre.length <= 100,
          ),
        ),
      ].slice(0, 10)
    : [];
}

export function saveProfileGenres(genres: string[]) {
  if (!store.get('user')) throw new Error('Войдите, чтобы изменить жанры');
  if (genres.length > 10 || genres.some((genre) => !genre || genre.length > 100))
    throw new Error('Выберите не больше 10 жанров');
  if (!writeJson(key() + ':genres', [...new Set(genres)]))
    throw new Error('Не удалось сохранить жанры на устройстве');
}
