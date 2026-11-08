const KNOWN_ERRORS = {
  'administrator access required': 'Это действие доступно только администратору.',
  'comment not found': 'Оценка не найдена. Обновите страницу.',
  'film not found': 'Фильм не найден.',
};

const STATUS_ERRORS = {
  400: 'Проверьте заполнение полей.',
  401: 'Сессия завершилась. Войдите снова, чтобы продолжить.',
  403: 'Недостаточно прав для этого действия.',
  404: 'Запись больше недоступна.',
  409: 'Это действие уже выполнено. Обновите страницу.',
};

export const errorMessage = (error) =>
  (error.status !== 401 && KNOWN_ERRORS[error.message]) ||
  STATUS_ERRORS[error.status] ||
  'Не удалось связаться с сервером. Попробуйте ещё раз.';
