import { Router } from './modules/router.js';
import { LoginPage } from './pages/login/login.js';
import { RegisterPage } from './pages/register/register.js';
import { applyTheme, getPreferredTheme } from './services/theme.js';

const app = document.getElementById('app');

if (!app) {
  throw new Error('Application root element #app was not found');
}

applyTheme(getPreferredTheme());

const router = new Router({
  '/': LoginPage,
  '/index.html': LoginPage,
  '/login': LoginPage,
  '/register': RegisterPage,
}, app);

router.start();
