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

const SERVER_ERROR_TEXT = {
  [ServerError.ADMIN_REQUIRED]: 'Это действие доступно только администратору.',
  [ServerError.FILM_NOT_FOUND]: 'Фильм не найден.',
  [ServerError.PERSON_NOT_FOUND]: 'Человек не найден.',
  [ServerError.REVIEW_CHANGED]: 'Отзыв изменён в другой вкладке. Обновите страницу.',
  [ServerError.REVIEW_EXISTS]: 'Вы уже написали отзыв на этот фильм. Обновите страницу.',
  [ServerError.REVIEW_NOT_FOUND]: 'Отзыв не найден. Обновите страницу.',
};

const STATUS_TEXT = {
  [HttpStatus.BAD_REQUEST]: 'Проверьте заполнение полей.',
  [HttpStatus.UNAUTHORIZED]: 'Сессия завершилась. Войдите снова, чтобы продолжить.',
  [HttpStatus.FORBIDDEN]: 'Недостаточно прав для этого действия.',
  [HttpStatus.NOT_FOUND]: 'Запись больше недоступна.',
  [HttpStatus.CONFLICT]: 'Это действие уже выполнено. Обновите страницу.',
};

export const errorMessage = (error) =>
  (error.status !== HttpStatus.UNAUTHORIZED && SERVER_ERROR_TEXT[error.message]) ||
  STATUS_TEXT[error.status] ||
  'Не удалось связаться с сервером. Попробуйте ещё раз.';
