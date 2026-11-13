import { ApiError } from '../../api/http.js';
import { StatusMessage } from './StatusMessage.js';

const defaultFailure: (error: unknown) => string = () => 'Не удалось загрузить данные.';

export function loadInto(owner, target, options) {
  const settings = { loading: 'Загружаем...', failure: defaultFailure, ...options };
  const placeholder = owner.insert(target, new StatusMessage({ text: settings.loading }));
  return attempt(owner, placeholder, settings);
}

async function attempt(owner, placeholder, settings) {
  let data;
  try {
    data = await settings.load();
  } catch (error) {
    if (placeholder.element) showFailure(owner, placeholder, settings, error);
    return null;
  }
  if (!placeholder.element) return null;
  const result = settings.render(data);
  if (result) owner.swap(placeholder, result);
  else owner.remove(placeholder);
  return result;
}

function showFailure(owner, placeholder, settings, error) {
  const failure = error instanceof ApiError && error.message === 'offline cache miss'
    ? 'Эти данные ещё не загружались. Подключитесь к сети и повторите.'
    : settings.failure(error);
  const { text, retry = true } = typeof failure === 'string' ? { text: failure } : failure;
  const message = new StatusMessage({
    text,
    retry: retry
      ? () =>
          attempt(
            owner,
            owner.swap(message, new StatusMessage({ text: settings.loading })),
            settings,
          )
      : null,
  });
  owner.swap(placeholder, message);
}
