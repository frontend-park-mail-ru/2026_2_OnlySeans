import { ApiError } from '../api/http.js';
import { homeBlocksExample, homeBlocksKey, parseHomeBlocks } from '../configured-ui/home-blocks.js';
import { parseJson, stringifyJson } from './json.js';
import {
  base, formText, installScopeDialog, isConflict, message, namePattern, positiveId,
  render, report, scopeOptions, scopes, type Resource, type Resources, type View,
} from './ui.js';
import template from './editor.hbs';

function jsonValue(raw: string) {
  if (!raw.trim()) throw new Error('Введите JSON-значение. Для пустого значения используйте null.');
  try {
    return parseJson(raw);
  } catch {
    throw new Error('Некорректный JSON. Проверьте кавычки, запятые и скобки.');
  }
}

function userIds(raw: string) {
  return [...new Set(raw.split(/[\s,]+/).filter(Boolean).map(positiveId))];
}

function payload(data: FormData, flags: boolean, resource?: Resource) {
  const scope = resource?.scope || formText(data, 'scope');
  const key = resource?.key || formText(data, 'key');
  const title = formText(data, 'title');
  if (!new RegExp(`^${namePattern}$`).test(key) || !scope) throw new Error('Выберите область и укажите корректный ключ.');
  if (!title) throw new Error('Укажите название.');
  const common = { scope, key, title, description: formText(data, 'description'), version: resource?.version };
  if (!flags) {
    const value = jsonValue(formText(data, 'value'));
    if (scope === 'reviews' && key === 'max_length' &&
      (typeof value !== 'number' || !Number.isInteger(value) || value < 50 || value > 20000)) {
      throw new Error('Максимальная длина отзыва должна быть целым числом от 50 до 20000.');
    }
    if (`${scope}.${key}` === homeBlocksKey) parseHomeBlocks(value);
    return { ...common, value };
  }
  const percent = formText(data, 'rollout_percent');
  const rollout_percent = Number(percent);
  if (!percent || !Number.isInteger(rollout_percent) || rollout_percent < 0 || rollout_percent > 100) {
    throw new Error('Укажите целый процент раскатки от 0 до 100.');
  }
  const force_on_user_ids = userIds(formText(data, 'force_on_user_ids'));
  const force_off_user_ids = userIds(formText(data, 'force_off_user_ids'));
  const excluded = new Set(force_off_user_ids);
  const overlap = force_on_user_ids.filter((id) => excluded.has(id));
  if (overlap.length) throw new Error(`ID одновременно в двух списках: ${overlap.join(', ')}.`);
  return { ...common, enabled: data.has('enabled'), rollout_percent, force_on_user_ids, force_off_user_ids };
}

export async function editor(view: View, kind: Resources, id: string) {
  const creating = id === 'new';
  const flags = kind === 'flags';
  const section = `${base}/${kind}`;
  const endpoint = creating ? `/${kind}` : `/${kind}/${id}`;
  render(view.root, '<section class="oc-panel">{{> status text="Загрузка…"}}<a href="{{section}}" data-admin-link>Вернуться к списку</a></section>', { section });
  try {
    const resource = creating ? undefined : await view.api<Resource>(endpoint, { signal: view.signal });
    if (view.signal.aborted) return;
    mount(resource);
  } catch (error) {
    report(view.root.querySelector('[role="status"]'), error, view.signal);
  }

  function mount(initial?: Resource) {
    let resource = initial;
    const kindLabel = flags ? 'флаг' : 'конфиг';
    render(view.root, template, {
      creating, flags, section, namePattern, resource, resourceId: id,
      heading: creating ? `Новый ${kindLabel}` : `${resource.scope}.${resource.key}`,
      version: resource?.version,
      json: creating ? '' : stringifyJson(resource.value, 2),
      percent: resource?.rollout_percent ?? 0,
      forceOn: resource?.force_on_user_ids?.join(', '),
      forceOff: resource?.force_off_user_ids?.join(', '),
      auditType: flags ? 'flag' : 'config',
    });
    const form = view.root.querySelector<HTMLFormElement>('[data-editor]');
    const status = form.querySelector('#oc-editor-status');
    const reload = form.querySelector<HTMLButtonElement>('#oc-reload');
    const save = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const remove = form.querySelector<HTMLButtonElement>('#oc-delete');
    const version = view.root.querySelector('[data-version]');
    const evaluate = flags && !creating ? installEvaluate(view, endpoint) : undefined;
    const snapshot = () => JSON.stringify([...new FormData(form)]);
    let baseline = snapshot();
    let busy = false;
    let stale = false;
    const select = form.querySelector('select');
    const keyInput = form.querySelector<HTMLInputElement>('[name="key"]');
    const example = form.querySelector<HTMLButtonElement>('#oc-home-blocks-example');
    const scopeStatus = form.querySelector('#oc-scope-status');
    let loadedScopes: Awaited<ReturnType<typeof scopes>> = [];
    view.guard(() => busy || snapshot() !== baseline);

    function buttons() {
      save.disabled = busy || stale;
      if (remove) remove.disabled = busy || stale;
      reload.hidden = !stale;
    }

    function updateExample() {
      if (example) {
        const fullKey = resource ? `${resource.scope}.${resource.key}` : `${select.value}.${keyInput.value}`;
        example.hidden = fullKey !== homeBlocksKey;
      }
    }
    updateExample();
    select?.addEventListener('change', updateExample);
    keyInput?.addEventListener('input', updateExample);
    example?.addEventListener('click', () => {
      const input = form.querySelector<HTMLTextAreaElement>('[name="value"]');
      if (input.value.trim() && !window.confirm('Заменить текущее значение примером блоков?')) return;
      input.value = stringifyJson(homeBlocksExample, 2);
      input.focus();
    });

    if (creating) {
      installScopeDialog(view, (created) => {
        loadedScopes = [...loadedScopes.filter((item) => item.name !== created.name), created];
        scopeOptions(select, loadedScopes, 'Выберите область', created.name);
        updateExample();
        message(scopeStatus, 'Область создана.');
      });
      void scopes(view).then((items) => {
        if (view.signal.aborted) return;
        loadedScopes = [...new Map([...items, ...loadedScopes].map((item) => [item.name, item])).values()];
        scopeOptions(select, loadedScopes, 'Выберите область', select.value);
        updateExample();
      }).catch((error) => report(scopeStatus, error, view.signal));
    }

    function failure(error: unknown) {
      if (view.signal.aborted) return;
      if (isConflict(error)) {
        stale = true;
        message(status, 'Запись уже изменилась. Скопируйте нужные правки из формы и загрузите актуальную версию.', true);
      } else if (error instanceof ApiError && error.code === 'duplicate_key') {
        message(status, 'В этой области уже есть запись с таким ключом.', true);
      } else {
        report(status, error, view.signal);
      }
    }

    reload.addEventListener('click', () => {
      if (window.confirm('Загрузить актуальную версию? Несохранённые изменения будут сброшены.')) {
        view.go(view.url.pathname, true);
      }
    });
    form.querySelector('#oc-format')?.addEventListener('click', () => {
      const input = form.querySelector('textarea[name="value"]') as HTMLTextAreaElement;
      try {
        input.value = stringifyJson(jsonValue(input.value), 2);
        if (!stale) message(status, '');
      } catch (error) {
        report(status, error, view.signal);
        input.focus();
      }
    });

    const fields = form.querySelector('fieldset');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy || stale) return;
      let body;
      try {
        body = payload(new FormData(form), flags, resource);
      } catch (error) {
        report(status, error, view.signal);
        return;
      }
      busy = true;
      fields.disabled = true;
      buttons();
      message(status, 'Сохранение…');
      try {
        const saved = await view.api<Resource>(endpoint, { method: creating ? 'POST' : 'PUT', body, signal: view.signal });
        if (view.signal.aborted) return;
        if (creating) {
          view.go(`${section}/${saved.id}?saved=1`, true);
          return;
        }
        resource = saved;
        fields.disabled = false;
        baseline = snapshot();
        version.textContent = String(saved.version);
        evaluate?.reset();
        message(status, 'Изменения сохранены.');
      } catch (error) {
        failure(error);
      } finally {
        busy = false;
        fields.disabled = false;
        buttons();
      }
    });

    remove?.addEventListener('click', async () => {
      if (busy || stale || !window.confirm(`Удалить ${resource.scope}.${resource.key}? Продукт применит резервное поведение.`)) return;
      busy = true;
      fields.disabled = true;
      buttons();
      message(status, 'Удаление…');
      try {
        await view.api(endpoint, { method: 'DELETE', params: { version: resource.version }, signal: view.signal });
        if (!view.signal.aborted) view.go(`${section}?deleted=1`);
      } catch (error) {
        failure(error);
      } finally {
        busy = false;
        fields.disabled = false;
        buttons();
      }
    });
    if (view.url.searchParams.has('saved')) {
      view.url.searchParams.delete('saved');
      view.replaceUrl(view.url);
      message(status, 'Запись создана.');
    }
  }
}

const reasons = {
  globally_disabled: 'Флаг выключен для всех',
  forced_off: 'Пользователь исключён персонально',
  forced_on: 'Пользователь включён персонально',
  rollout_match: 'Пользователь попал в процентную группу',
  rollout_miss: 'Пользователь вне процентной группы',
};

function installEvaluate(view: View, endpoint: string) {
  const form = view.root.querySelector<HTMLFormElement>('[data-evaluate]');
  const status = form.querySelector('[role="status"]');
  let active: AbortController;
  const reset = () => {
    active?.abort();
    message(status, '');
  };
  form.addEventListener('input', reset);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    reset();
    active = new AbortController();
    const signal = AbortSignal.any([view.signal, active.signal]);
    try {
      const user_id = positiveId(formText(new FormData(form), 'user_id'));
      message(status, 'Проверяем…');
      const result = await view.api<{ enabled: boolean; reason: keyof typeof reasons; revision: number; bucket: number | null }>(
        `${endpoint}/evaluate`, { method: 'POST', body: { user_id }, signal },
      );
      if (signal.aborted) return;
      const bucket = result.bucket == null ? '' : ` · bucket ${result.bucket}`;
      message(status, `${result.enabled ? 'Включено' : 'Выключено'} · ${reasons[result.reason] ?? result.reason}${bucket} · revision ${result.revision}`);
    } catch (error) {
      if (!signal.aborted && error instanceof ApiError && error.status === 404) {
        message(status, error.message === 'HTTP 404' ? 'Пользователь или флаг не найден.' : error.message, true);
      } else {
        report(status, error, signal);
      }
    }
  });
  return { reset };
}
