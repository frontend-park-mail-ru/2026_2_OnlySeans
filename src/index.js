import './core/helpers.js';
import { Router } from './app/router.js';
import { routes, notFound } from './app/routes.js';
import { AppLayout } from './components/app-layout/AppLayout.js';
import { BareLayout } from './components/bare-layout/BareLayout.js';
import { ToastStack } from './components/toast/ToastStack.js';
import { refreshSession, restoreSession, watchSessionOnReturn } from './services/session.js';
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

watchSessionOnReturn(() => router.refresh());

Promise.all([restoreSession(), stylesReady(), fontsReady()]).then(() => router.start());
