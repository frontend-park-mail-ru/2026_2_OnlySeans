import { LibraryPage } from './pages/library/library.js';
import { DiscoverPage } from './pages/discover/discover.js';
import { MovieCategoryPage } from './pages/movie-category/movie-category.js';
import { initializeDemoSession } from './services/demo-auth.js';
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
initializeDemoSession();

const router = new Router({
  '/': LoginPage,
  '/index.html': LoginPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/collections': CollectionsPage,
  '404': NotFoundPage,
  '/discover': DiscoverPage,
  '/library': LibraryPage,
  '/search': LibraryPage,
  '/movies/russian-films': MovieCategoryPage,
  '/movies/russian-series': MovieCategoryPage,
  '/movies/foreign-films': MovieCategoryPage,
  '/movies/foreign-series': MovieCategoryPage,
  '/movies/russian': MovieCategoryPage,
  '/movies/foreign': MovieCategoryPage,
  '/movies/recommended': MovieCategoryPage,
}, app);

router.start();
