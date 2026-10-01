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

import { eventBus, EVENTS } from './modules/event-bus.js';
import { store } from './modules/store.js';

eventBus.listen(EVENTS.AUTH_LOGIN, (user) => {
  console.log('[шина] вход:', user);
});

eventBus.listen(EVENTS.AUTH_REGISTER, (user) => {
  console.log('[шина] регистрация:', user);
});

store.watch('user', (user) => {
  console.log('[store] user изменился:', user);
});

router.start();
