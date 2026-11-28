import '../styles/tokens.css';
import '../styles/base.css';
import './admin.css';
import { ApiError, request } from '../api/http.js';
import { authPath } from '../services/auth-return.js';
import { audit } from './audit.js';
import { editor } from './editor.js';
import { resourceList } from './list.js';
import { base, render, type View } from './ui.js';
import shell from './shell.hbs';

const root = document.getElementById('onlineconf');
let controller = new AbortController();
let user: { id: number; role: string } | undefined;
let hasChanges = () => false;
let current = location.pathname + location.search;

const accessTemplate = `<main class="oc-access oc-panel">
  <h1>OnlineConf</h1>
  {{> status text=message canRetry=retry}}
  {{#if login}}{{> button variant="primary" href=login text="Войти в Frame"}}{{/if}}
  <a href="/">В кинотеатр</a>
</main>`;

function access(message: string, options = {}) {
  render(root, accessTemplate, { message, ...options });
  root.querySelector('.status-message__retry')?.addEventListener('click', () => void start());
}

function deny(status: number) {
  controller.abort();
  user = undefined;
  hasChanges = () => false;
  if (status === 401) {
    access('Войдите в Frame, чтобы открыть OnlineConf.', { login: authPath('login', current) });
  } else {
    access('У вашей учётной записи нет доступа к OnlineConf.');
  }
}

const api: typeof request = async (path, options) => {
  try {
    return await request(`/onlineconf/admin${path}`, options);
  } catch (error) {
    if (!options?.signal?.aborted && error instanceof ApiError && [401, 403].includes(error.status)) {
      deny(error.status);
    }
    throw error;
  }
};

function go(path: string, replace = false) {
  if (replace) history.replaceState(null, '', path);
  else history.pushState(null, '', path);
  void show();
}

async function show() {
  controller.abort();
  controller = new AbortController();
  hasChanges = () => false;
  current = location.pathname + location.search;
  if (!user) return start();
  const url = new URL(location.href);
  if (url.pathname === base || url.pathname === `${base}/`) return go(`${base}/configs`, true);
  const path = url.pathname.replace(/\/$/, '');
  const route = path.match(/^\/onlineconf\/(configs|flags)(?:\/(new|[1-9]\d*))?$/);
  const kind = route?.[1] === 'flags' ? 'flags' : 'configs';
  const auditRoute = path === `${base}/audit`;
  render(root, shell, { user, configs: !!route && kind === 'configs', flags: !!route && kind === 'flags', audit: auditRoute });
  const view: View = {
    root: root.querySelector('main'),
    url,
    signal: controller.signal,
    api,
    go,
    replaceUrl: (next) => {
      current = next.pathname + next.search;
      history.replaceState(null, '', current);
    },
    guard: (handler) => { hasChanges = handler; },
  };
  if (auditRoute) return audit(view);
  if (route?.[2]) return editor(view, kind, route[2]);
  if (route) return resourceList(view, kind);
  view.root.textContent = 'Страница OnlineConf не найдена.';
}

async function start() {
  controller.abort();
  controller = new AbortController();
  const { signal } = controller;
  access('Проверяем доступ…');
  try {
    const admin = await api<typeof user>('/me', { signal });
    if (signal.aborted) return;
    if (!admin?.id || admin.role !== 'admin') return deny(403);
    user = admin;
    await show();
  } catch {
    if (!signal.aborted) access('Не удалось проверить доступ. Попробуйте ещё раз.', { retry: true });
  }
}

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-admin-link], a[data-link]');
  if (!link || link.origin !== location.origin || !link.pathname.startsWith(`${base}/`)) return;
  event.preventDefault();
  if (canLeave()) go(link.pathname + link.search);
});

const canLeave = () => !hasChanges() || window.confirm('Уйти без сохранения изменений?');

window.addEventListener('popstate', () => {
  if (canLeave()) void show();
  else history.pushState(null, '', current);
});

window.addEventListener('beforeunload', (event) => {
  if (hasChanges()) event.preventDefault();
});

void start();
