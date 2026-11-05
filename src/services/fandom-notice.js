import { showNotice } from './notice.js';
import { authPath } from './auth-return.js';
export const showFandomError = (
  error,
  {
    message = 'Не удалось выполнить действие. Попробуйте ещё раз.',
    retry,
    returnTo = location.pathname + location.search + location.hash,
  } = {},
) => {
  if (error?.name === 'AbortError') return;
  if (error?.status === 401) message = 'Сессия завершилась. Войдите снова, чтобы продолжить.';
  if (error?.status === 403) message = 'Недостаточно прав для этого действия.';
  if (error?.status === 404) message = 'Запись удалена или больше недоступна.';
  let action;
  if (retry) action = { label: 'Повторить', onClick: retry };
  if (error?.status === 401) action = { label: 'Войти', href: authPath('login', returnTo) };
  showNotice(message, { type: 'error', action });
};
