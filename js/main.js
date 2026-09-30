import { Router } from '/router.js';
import { NotFoundView } from './pages/not-found.js';

const routes = {
  404: NotFoundView,
};

const router = new Router(routes, document.getElementById('app'));
router.start();
