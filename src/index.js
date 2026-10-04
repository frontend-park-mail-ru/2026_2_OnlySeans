import { DiscoverPage } from './pages/discover/discover.js';
import { Router } from './modules/router.js';
import { LoginModalPage, RegisterModalPage } from './pages/auth/auth.js';
import { CollectionsPage } from './pages/collections/collections.js';
import { applyTheme, getPreferredTheme } from './services/theme.js';
import { NotFoundPage } from './pages/not-found/not-found.js';
import { HomePage } from './pages/home/home.js';
import { FilmsPage, SeriesPage } from './pages/catalog/catalog.js';
import { CollectionPage } from './pages/collection/collection.js';
import { FilmPage } from './pages/film/film.js';
import { FavoritesPage, WatchlistPage } from './pages/library/library.js';
import { ProfilePage } from './pages/profile/profile.js';

const app = document.getElementById('app');

if (!app) {
  throw new Error('Application root element #app was not found');
}

applyTheme(getPreferredTheme());

const router = new Router({
  '/': HomePage,
  '/discover': DiscoverPage,
  '/login': LoginModalPage,
  '/register': RegisterModalPage,
  '/films': FilmsPage,
  '/series': SeriesPage,
  '/film': FilmPage,
  '/collections': CollectionsPage,
  '/collection': CollectionPage,
  '/favorites': FavoritesPage,
  '/watchlist': WatchlistPage,
  '/profile': ProfilePage,
  '404': NotFoundPage,
}, app);

router.start();
