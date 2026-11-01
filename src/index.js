import './styles/style.css';

import { DiscoverPage } from './pages/discover/discover.js';
import { Router } from './modules/router.js';
import { LoginPage } from './pages/login/login.js';
import { RegisterPage } from './pages/register/register.js';
import { CollectionsPage } from './pages/collections/collections.js';
import { applyTheme, getPreferredTheme } from './services/theme.js';
import { NotFoundPage } from './pages/not-found/not-found.js';

const app = document.getElementById('app');

if (!app) {
  throw new Error('Application root element #app was not found');
}

applyTheme(getPreferredTheme());

if (__ENABLE_SERVICE_WORKER__ && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.error('Failed to register service worker:', error);
    });
  });
}

const router = new Router({
  '/': DiscoverPage,
  '/discover': DiscoverPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/collections': CollectionsPage,
  '404': NotFoundPage,
}, app);

router.start();
