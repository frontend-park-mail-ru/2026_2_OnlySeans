import { base, installScopeDialog, message, render, report, scopeOptions, scopes, type Page, type Resource, type Resources, type Scope, type View } from './ui.js';
import { stringifyJson } from './json.js';
import template from './list.hbs';

const limit = 50;
const rowsTemplate = `<table>
  <thead><tr><th>Ключ</th><th>Название</th><th>Значение</th><th>Версия</th></tr></thead>
  <tbody>{{#each items}}<tr>
    <td><a href="{{href}}" data-admin-link>{{scope}}.{{key}}</a></td>
    <td>{{title}}</td><td><code>{{summary}}</code></td><td>{{version}}</td>
  </tr>{{/each}}</tbody>
</table>`;

export async function resourceList(view: View, kind: Resources) {
  const flags = kind === 'flags';
  const path = `${base}/${kind}`;
  render(view.root, template, { flags, newPath: `${path}/new`, newLabel: flags ? 'Создать флаг' : 'Создать конфиг' });
  const search = view.root.querySelector<HTMLInputElement>('[type="search"]');
  const select = view.root.querySelector('select');
  const status = view.root.querySelector('#oc-list-status');
  const scopeStatus = view.root.querySelector('#oc-scope-status');
  const rows = view.root.querySelector<HTMLElement>('[data-rows]');
  const prev = view.root.querySelector<HTMLButtonElement>('#oc-prev');
  const next = view.root.querySelector<HTMLButtonElement>('#oc-next');
  let offset = Math.max(0, Number(view.url.searchParams.get('offset')) || 0);
  if (!Number.isSafeInteger(offset)) offset = 0;
  let timer: ReturnType<typeof setTimeout>;
  let active: AbortController;
  let items: Scope[] = [];
  let selected = view.url.searchParams.get('scope') || '';
  search.value = view.url.searchParams.get('q') || '';
  if (view.url.searchParams.has('deleted')) message(scopeStatus, 'Запись удалена.');

  const setScopes = () => {
    const options = selected && !items.some((item) => item.name === selected)
      ? [...items, { name: selected, title: selected }] : items;
    scopeOptions(select, options, 'Все области', selected);
  };
  setScopes();

  async function load() {
    active?.abort();
    const request = active = new AbortController();
    const signal = AbortSignal.any([view.signal, request.signal]);
    const q = search.value.trim();
    view.url.search = '';
    if (q) view.url.searchParams.set('q', q);
    if (selected) view.url.searchParams.set('scope', selected);
    if (offset) view.url.searchParams.set('offset', String(offset));
    view.replaceUrl(view.url);
    rows.replaceChildren();
    prev.disabled = next.disabled = true;
    message(status, 'Загрузка…');
    try {
      const page = await view.api<Page<Resource>>(`/${kind}`, { params: { q, scope: selected, limit, offset }, signal });
      if (signal.aborted) return;
      if (offset && offset >= page.total) {
        offset = 0;
        return void load();
      }
      if (!page.total) {
        return message(status, q || selected ? 'По этим фильтрам ничего не найдено.' : 'Здесь пока нет записей.');
      }
      render(rows, rowsTemplate, {
        items: page.items.map((item) => ({
          ...item,
          href: `${path}/${item.id}`,
          summary: flags ? (item.enabled ? `Включён · ${item.rollout_percent}%` : 'Выключен') : stringifyJson(item.value),
        })),
      });
      message(status, `${offset + 1}–${offset + page.items.length} из ${page.total}`);
      prev.disabled = offset === 0;
      next.disabled = offset + page.items.length >= page.total || !page.items.length;
    } catch (error) {
      report(status, error, signal);
    }
  }

  function reload() {
    clearTimeout(timer);
    void load();
  }
  view.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  search.addEventListener('input', () => {
    clearTimeout(timer);
    active?.abort();
    offset = 0;
    rows.replaceChildren();
    prev.disabled = next.disabled = true;
    message(status, 'Поиск…');
    timer = setTimeout(load, 300);
  });
  select.addEventListener('change', () => {
    selected = select.value;
    offset = 0;
    reload();
  });
  view.root.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    reload();
  });
  prev.addEventListener('click', () => { offset = Math.max(0, offset - limit); reload(); });
  next.addEventListener('click', () => { offset += limit; reload(); });
  installScopeDialog(view, (created) => {
    items = [...items.filter(({ name }) => name !== created.name), created];
    selected = created.name;
    setScopes();
    offset = 0;
    reload();
    message(scopeStatus, 'Область создана.');
  });
  void load();
  try {
    const loaded = await scopes(view);
    if (view.signal.aborted) return;
    items = [...new Map([...loaded, ...items].map((item) => [item.name, item])).values()];
    setScopes();
  } catch (error) {
    report(scopeStatus, error, view.signal);
  }
}
