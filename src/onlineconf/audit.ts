import { message, render, report, type Page, type View } from './ui.js';
import { stringifyJson } from './json.js';
import template from './audit.hbs';

type Entry = {
  actor_id: number | null;
  actor_name: string;
  resource_type: string;
  resource_id: number;
  scope: string;
  key: string;
  action: string;
  before: unknown;
  after: unknown;
  revision: number;
  created_at: string;
};

const limit = 25;
const time = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'medium' });
const actions = { create: 'Создание', update: 'Изменение', delete: 'Удаление' };
const types = { config: 'Конфиг', flag: 'Флаг', scope: 'Область' };

export async function audit(view: View) {
  const params = view.url.searchParams;
  const type = params.get('resource_type') || '';
  const id = params.get('resource_id') || '';
  const resource_type = Object.hasOwn(types, type) ? type : '';
  const resource_id = /^\d+$/.test(id) ? id : '';
  const rawOffset = Number(params.get('offset'));
  const offset = Number.isSafeInteger(rawOffset) && rawOffset > 0 ? rawOffset : 0;
  const link = (index: number) => {
    const query = new URLSearchParams();
    if (resource_type) query.set('resource_type', resource_type);
    if (resource_id) query.set('resource_id', resource_id);
    if (index) query.set('offset', String(index));
    return query.size ? `/onlineconf/audit?${query}` : '/onlineconf/audit';
  };
  render(view.root, template, {
    resource_id, filtered: !!(resource_type || resource_id),
    types: Object.entries(types).map(([value, label]) => ({ value, label })),
  });
  const select = view.root.querySelector('select');
  select.value = resource_type;
  select.addEventListener('change', () => {
    view.go(select.value ? `/onlineconf/audit?resource_type=${select.value}` : '/onlineconf/audit');
  });
  const status = view.root.querySelector('[role="status"]');
  try {
    const page = await view.api<Page<Entry>>('/audit', {
      params: { resource_type, resource_id, limit, offset }, signal: view.signal,
    });
    if (view.signal.aborted) return;
    message(status, page.total ? `Записей: ${page.total}` : 'Изменений пока нет.');
    render(view.root.querySelector('[data-entries]'), entries, {
      prev: offset ? link(Math.max(offset - limit, 0)) : '',
      next: page.items.length && offset + page.items.length < page.total ? link(offset + limit) : '',
      items: page.items.map((entry) => {
        const date = new Date(entry.created_at);
        return {
          ...entry,
          date: Number.isNaN(date.getTime()) ? entry.created_at : time.format(date),
          actor: entry.actor_name || (entry.actor_id ? `#${entry.actor_id}` : 'Автор неизвестен'),
          name: [entry.scope, entry.key].filter(Boolean).join('.') || `#${entry.resource_id}`,
          type: types[entry.resource_type] || entry.resource_type,
          action: actions[entry.action] || entry.action,
          beforeText: entry.before == null ? 'Запись ещё не существовала.' : stringifyJson(entry.before, 2),
          afterText: entry.after == null ? 'Запись удалена.' : stringifyJson(entry.after, 2),
        };
      }),
    });
  } catch (error) {
    report(status, error, view.signal);
  }
}

const entries = `{{#each items}}
  <details class="oc-entry">
    <summary><strong>{{action}} · {{name}}</strong> · {{type}} · {{actor}} · <time datetime="{{created_at}}" title="{{created_at}}">{{date}}</time> · revision {{revision}}</summary>
    <div class="oc-fields">
      <div><h3>До</h3><pre>{{beforeText}}</pre></div>
      <div><h3>После</h3><pre>{{afterText}}</pre></div>
    </div>
  </details>
{{/each}}
<nav class="oc-actions" aria-label="Страницы истории">
  {{#if prev}}{{> button variant="secondary" href=prev text="Назад"}}{{/if}}
  {{#if next}}{{> button variant="secondary" href=next text="Далее"}}{{/if}}
</nav>`;
