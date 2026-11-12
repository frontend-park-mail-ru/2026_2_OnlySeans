import './styles/tokens.css';
import './styles/base.css';
import './styles/transitions.css';
import './core/helpers.js';
import { Router } from './app/router.js';
import { routes, notFound } from './app/routes.js';
import { AppLayout } from './components/app-layout/AppLayout.js';
import { BareLayout } from './components/bare-layout/BareLayout.js';
import { ToastStack } from './components/toast/ToastStack.js';
import { refreshSession, restoreSession, watchSessionOnReturn } from './services/session.js';
import { syncFilmEdits } from './services/offline-film-edits.js';
import { notify } from './services/notice.js';
import { fontsReady, stylesReady } from './core/assets.js';

document.addEventListener(
  'error',
  (event) => {
    if (event.target instanceof HTMLImageElement) event.target.dataset.broken = '';
  },
  true,
);
document.body.append(new ToastStack().render());

const router = new Router({
  routes,
  notFound,
  layouts: { app: AppLayout, bare: BareLayout },
  root: document.getElementById('app'),
  checkSession: () => refreshSession({ maxAge: 5000 }),
});

async function reconnect() {
  await refreshSession();
  await syncFilmEdits();
  router.refresh();
}

watchSessionOnReturn(() => router.refresh());
window.addEventListener('online', () => void reconnect());
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden && await syncFilmEdits()) router.refresh();
});
window.addEventListener('offline', () => notify('Вы офлайн. Доступны ранее загруженные данные.'));

Promise.all([restoreSession(), stylesReady(), fontsReady()]).then(async () => {
  router.start();
  if (!navigator.onLine) notify('Вы офлайн. Доступны ранее загруженные данные.');
  else if (await syncFilmEdits()) router.refresh();
});
