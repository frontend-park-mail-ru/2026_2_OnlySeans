import { ProfilePage } from './pages/people/profile.js';
import { ActorPage } from './pages/people/actor.js';
import { PersonPage } from './pages/people/person.js';
import { MyFandomsPage } from './pages/film/my-fandoms.js';
import { FilmPage } from './pages/film/film.js';
import { DiscoverPage } from './pages/discover/discover.js';
import { CatalogPage } from './pages/catalog/catalog.js';
import { PersonalCollectionsPage } from './pages/catalog/personal-collections.js';
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

const router = new Router(
  {
    '/': DiscoverPage,
    '/discover': DiscoverPage,
    '/collections': CollectionsPage,
    '/films': CatalogPage,
    '/profile': ProfilePage,
    '/actor/:name': ActorPage,
    '/director/:name': PersonPage,
    '/producer/:name': PersonPage,
    '/film/:id': FilmPage,
    '/film/:id/fandom': FilmPage,
    '/film/:id/discussion': FilmPage,
    '/film/:id/comments': FilmPage,
    '/film/:id/merch': FilmPage,
    '/film/:id/thread/:threadId': FilmPage,
    '/series': CatalogPage,
    '/watch-later': CatalogPage,
    '/favorites': CatalogPage,
    '/watched': CatalogPage,
    '/my-collections': PersonalCollectionsPage,
    '/me/discussions': MyFandomsPage,
    '/login': LoginPage,
    '/register': RegisterPage,
    '404': NotFoundPage,
  },
  app,
);

router.start();
