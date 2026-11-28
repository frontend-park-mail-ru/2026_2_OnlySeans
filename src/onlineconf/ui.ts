import { ApiError, request } from '../api/http.js';
import { Handlebars } from '../core/handlebars.js';
import button from '../components/button/Button.hbs';
import field from '../components/text-field/TextField.hbs';
import status from '../components/status-message/StatusMessage.hbs';
import '../components/button/button.css';
import '../components/text-field/text-field.css';
import '../components/status-message/status-message.css';
import '../components/modal/modal.css';

Handlebars.registerPartial({ button, field, status });

export const base = '/onlineconf';
export const namePattern = '[a-z][a-z0-9_]{0,63}';

export type Resources = 'configs' | 'flags';
export type Scope = { name: string; title: string };
export type Page<T> = { items: T[]; total: number };
export type Resource = {
  id: number;
  scope: string;
  key: string;
  title: string;
  description: string;
  version: number;
  value?: unknown;
  enabled?: boolean;
  rollout_percent?: number;
  force_on_user_ids?: number[];
  force_off_user_ids?: number[];
};

export interface View {
  root: HTMLElement;
  url: URL;
  signal: AbortSignal;
  api: typeof request;
  go: (path: string, replace?: boolean) => void;
  replaceUrl: (url: URL) => void;
  guard: (hasChanges: () => boolean) => void;
}

export function render(root: HTMLElement, source: string, values?: unknown) {
  root.innerHTML = Handlebars.compile(source)(values);
}

export function message(target: Element, text: string, error = false) {
  target.textContent = text;
  target.classList.toggle('oc-error', error);
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Не удалось выполнить запрос.';
}

export function report(target: Element, error: unknown, signal: AbortSignal) {
  if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
  message(target, errorMessage(error), true);
}

export async function scopes(view: View) {
  const result = await view.api<Scope[] | Page<Scope>>('/scopes', { signal: view.signal });
  return Array.isArray(result) ? result : result.items;
}

export function scopeOptions(select: HTMLSelectElement, items: Scope[], placeholder: string, selected = '') {
  select.replaceChildren(new Option(placeholder, ''));
  for (const { name, title } of items) {
    select.add(new Option(title && title !== name ? `${title} (${name})` : name, name));
  }
  select.value = selected;
}

export function formText(form: FormData, field: string) {
  return String(form.get(field) ?? '').trim();
}

export function positiveId(value: string) {
  const id = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1) {
    throw new Error('Укажите положительный числовой ID пользователя.');
  }
  return id;
}

export function isConflict(error: unknown) {
  return error instanceof ApiError && error.status === 409 && error.code !== 'duplicate_key';
}

export function installScopeDialog(view: View, onCreated: (scope: Scope) => void) {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('aria-labelledby', 'oc-scope-heading');
  render(dialog, `<form>
    <h2 id="oc-scope-heading" class="modal__title">Новая область</h2>
    {{> field id="oc-scope-name" name="name" label="Имя" type="text" required=true maxChars=64 pattern=namePattern describedBy="oc-scope-help"}}
    <small id="oc-scope-help">Строчная латиница, цифры и подчёркивание. Первый символ — буква.</small>
    {{> field id="oc-scope-title" name="title" label="Название" type="text" required=true}}
    {{> status}}
    <div class="modal__actions">
      {{> button variant="secondary" type="button" text="Отмена"}}
      {{> button variant="primary" type="submit" text="Создать"}}
    </div>
  </form>`, { namePattern });
  view.root.append(dialog);
  const form = dialog.querySelector('form');
  const status = dialog.querySelector('p');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  form.querySelector('[type="button"]').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const data = new FormData(form);
    const name = formText(data, 'name');
    const title = formText(data, 'title');
    if (!title) return message(status, 'Укажите название области.', true);
    submit.disabled = true;
    message(status, 'Создаём область…');
    try {
      const scope = await view.api<Scope>('/scopes', { method: 'POST', body: { name, title }, signal: view.signal });
      if (view.signal.aborted) return;
      dialog.close();
      form.reset();
      message(status, '');
      onCreated(scope);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) message(status, 'Область с таким именем уже существует.', true);
      else report(status, error, view.signal);
    } finally {
      submit.disabled = false;
    }
  });
  view.root.querySelector('#oc-scope-new').addEventListener('click', () => dialog.showModal());
}
