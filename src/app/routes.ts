import { HomePage } from '../pages/home/HomePage.js';
import { CatalogPage } from '../pages/catalog/CatalogPage.js';
import { CollectionsPage } from '../pages/collections/CollectionsPage.js';
import { CollectionPage } from '../pages/collection/CollectionPage.js';
import { LibraryListPage } from '../pages/library-list/LibraryListPage.js';
import { AuthPage } from '../pages/auth/AuthPage.js';
import { FilmPage } from '../pages/film/FilmPage.js';
import { PersonPage } from '../pages/person/PersonPage.js';
import { NotFoundPage } from '../pages/not-found/NotFoundPage.js';
import { SearchPage } from '../pages/search/SearchPage.js';
import { FavoritesPage } from '../pages/favorites/FavoritesPage.js';
import { GenresPage } from '../pages/genres/GenresPage.js';
import type { Route } from './router.js';

const GUEST_ONLY = { layout: 'bare', access: 'guest' };

export const routes: Route[] = [
  {
    path: '/admin',
    access: 'user',
    load: () =>
      import('../pages/admin/AdminCatalogPage.js').then((module) => module.AdminCatalogPage),
  },
  {
    path: '/admin/films/new',
    access: 'user',
    load: () => import('../pages/admin/AdminFilmPage.js').then((module) => module.AdminFilmPage),
  },
  {
    path: '/admin/films/:id/edit',
    access: 'user',
    load: () => import('../pages/admin/AdminFilmPage.js').then((module) => module.AdminFilmPage),
  },
  { path: '/', page: HomePage },
  { path: '/discover', redirect: '/' },
  { path: '/films', page: CatalogPage, props: { type: 'movie' } },
  { path: '/series', page: CatalogPage, props: { type: 'series' } },
  { path: '/search', page: SearchPage },
  { path: '/genres', page: GenresPage },
  {
    path: '/upcoming',
    load: () => import('../pages/upcoming/UpcomingPage.js').then((module) => module.UpcomingPage),
  },
  { path: '/map', load: () => import('../pages/map/MapPage.js').then((module) => module.MapPage) },
  {
    path: '/settings',
    load: () => import('../pages/settings/SettingsPage.js').then((module) => module.SettingsPage),
  },
  {
    path: '/wheel',
    load: () => import('../pages/wheel/WheelPage.js').then((module) => module.WheelPage),
  },
  {
    path: '/wheel/history',
    load: () => import('../pages/wheel/WheelPage.js').then((module) => module.WheelPage),
  },
  { path: '/collections', page: CollectionsPage },
  { path: '/collections/:id', page: CollectionPage },
  { path: '/film/:id', page: FilmPage },
  { path: '/person/:id', page: PersonPage },
  { path: '/watch-later', page: LibraryListPage, props: { list: 'watchlater' } },
  { path: '/favorites', page: FavoritesPage },
  { path: '/watched', page: LibraryListPage, props: { list: 'watched' } },
  {
    path: '/profile',
    load: () => import('../pages/profile/ProfilePage.js').then((module) => module.ProfilePage),
    access: 'user',
  },
  { path: '/login', page: AuthPage, props: { mode: 'login' }, ...GUEST_ONLY },
  { path: '/register', page: AuthPage, props: { mode: 'register' }, ...GUEST_ONLY },
];

export const notFound = { page: NotFoundPage, layout: 'app' };
