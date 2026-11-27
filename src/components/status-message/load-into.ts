import { ApiError } from '../../api/http.js';
import { Component } from '../../core/component.js';
import { StatusMessage } from './StatusMessage.js';

interface LoadOptions<T> {
  load(): Promise<T>;
  render(data: T): Component | null | void;
  loading?: string;
  loadingView?: () => Component;
  failure?: (error: unknown) => string | { text: string; retry?: boolean };
  failureView?: (error: unknown, retry: () => Promise<Component | null | void>) => Component;
}

/** Показывает загрузку, результат или ошибку с повтором запроса. */
export function loadInto<T>(owner: Component, target: string | Element, options: LoadOptions<T>) {
  const settings = {
    loading: 'Загружаем...',
    failure: () => 'Не удалось загрузить данные.',
    ...options,
  };
  return attempt(owner, owner.insert(target, loadingView(settings)), settings);
}

async function attempt<T>(
  owner: Component,
  placeholder: Component,
  settings: LoadOptions<T>,
): Promise<Component | null | void> {
  let data: T;
  try {
    data = await settings.load();
  } catch (error) {
    if (placeholder.element.isConnected) showFailure(owner, placeholder, settings, error);
    return null;
  }
  if (!placeholder.element.isConnected) return null;
  const result = settings.render(data);
  if (result) owner.swap(placeholder, result);
  else owner.remove(placeholder);
  return result;
}

function showFailure<T>(
  owner: Component,
  placeholder: Component,
  settings: LoadOptions<T>,
  error: unknown,
) {
  if (settings.failureView) {
    const view = settings.failureView(error, () =>
      attempt(owner, owner.swap(view, loadingView(settings)), settings),
    );
    owner.swap(placeholder, view);
    return;
  }
  const failure =
    error instanceof ApiError && error.message === 'offline cache miss'
      ? 'Эти данные ещё не загружались. Подключитесь к сети и повторите.'
      : settings.failure?.(error) || 'Не удалось загрузить данные.';
  const { text, retry = true } = typeof failure === 'string' ? { text: failure } : failure;
  const message = new StatusMessage({
    text,
    retry: retry
      ? () => attempt(owner, owner.swap(message, loadingView(settings)), settings)
      : null,
  });
  owner.swap(placeholder, message);
}

function loadingView<T>(settings: LoadOptions<T>) {
  return settings.loadingView?.() || new StatusMessage({ text: settings.loading });
}
