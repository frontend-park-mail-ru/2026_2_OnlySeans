import { Router } from '../router.js';
import { LoginPage } from './pages/login.js';
import { RegisterPage } from './pages/register.js';
import { applyTheme, getPreferredTheme } from './services/theme.js';

const app = document.getElementById('app');

if (!app) {
  throw new Error('Application root element #app was not found');
}

applyTheme(getPreferredTheme());

const router = new Router({
  '/': LoginPage,
  '/login': LoginPage,
  '/login.html': LoginPage,
  '/register': RegisterPage,
  '/register.html': RegisterPage,
}, app);

router.start();