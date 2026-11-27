/** Статусы, для которых интерфейс различает отсутствие данных, доступ и конфликт записи. */
export const HttpStatus = Object.freeze({
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
});

export const ServerError = Object.freeze({
  ADMIN_REQUIRED: 'administrator access required',
  FILM_NOT_FOUND: 'film not found',
  PERSON_NOT_FOUND: 'person not found',
  REVIEW_CHANGED: 'review was changed by someone else, reload it',
  REVIEW_EXISTS: 'review already exists',
  REVIEW_NOT_FOUND: 'review not found',
});

export const REVIEW_CONFLICT_MESSAGE = 'Отзыв изменён в другой вкладке. Обновите страницу.';

const SERVER_ERROR_TEXT: Record<string, string> = {
  [ServerError.ADMIN_REQUIRED]: 'Это действие доступно только администратору.',
  [ServerError.FILM_NOT_FOUND]: 'Фильм не найден.',
  [ServerError.PERSON_NOT_FOUND]: 'Человек не найден.',
  [ServerError.REVIEW_CHANGED]: REVIEW_CONFLICT_MESSAGE,
  [REVIEW_CONFLICT_MESSAGE]: REVIEW_CONFLICT_MESSAGE,
  [ServerError.REVIEW_EXISTS]: 'Вы уже написали отзыв на этот фильм. Обновите страницу.',
  [ServerError.REVIEW_NOT_FOUND]: 'Отзыв не найден. Обновите страницу.',
};

const STATUS_TEXT: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Проверьте заполнение полей.',
  [HttpStatus.UNAUTHORIZED]: 'Сессия завершилась. Войдите снова, чтобы продолжить.',
  [HttpStatus.FORBIDDEN]: 'Недостаточно прав для этого действия.',
  [HttpStatus.NOT_FOUND]: 'Запись больше недоступна.',
  [HttpStatus.CONFLICT]: 'Это действие уже выполнено. Обновите страницу.',
};

export function errorMessage(error: unknown): string {
  const details = error instanceof Error ? error : null;
  const status =
    details && 'status' in details && typeof details.status === 'number' ? details.status : 0;
  return (
    (status !== HttpStatus.UNAUTHORIZED && details && SERVER_ERROR_TEXT[details.message]) ||
    STATUS_TEXT[status] ||
    'Не удалось связаться с сервером. Попробуйте ещё раз.'
  );
}
