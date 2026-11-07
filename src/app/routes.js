import { HomePage } from '../pages/home/HomePage.js';
import { CatalogPage } from '../pages/catalog/CatalogPage.js';
import { CollectionsPage } from '../pages/collections/CollectionsPage.js';
import { CollectionPage } from '../pages/collection/CollectionPage.js';
import { LibraryListPage } from '../pages/library-list/LibraryListPage.js';
import { AuthPage } from '../pages/auth/AuthPage.js';
import { FilmPage } from '../pages/film/FilmPage.js';
import { ProfilePage } from '../pages/profile/ProfilePage.js';
import { NotFoundPage } from '../pages/not-found/NotFoundPage.js';

const GUEST_ONLY = { layout: 'bare', access: 'guest' };

export const routes = [
  { path: '/', page: HomePage },
  { path: '/discover', redirect: '/' },
  { path: '/films', page: CatalogPage, props: { type: 'movie' } },
  { path: '/series', page: CatalogPage, props: { type: 'series' } },
  { path: '/collections', page: CollectionsPage },
  { path: '/collections/:id', page: CollectionPage },
  { path: '/film/:id', page: FilmPage },
  { path: '/watch-later', page: LibraryListPage, props: { list: 'watchlater' } },
  { path: '/favorites', page: LibraryListPage, props: { list: 'favorite' } },
  { path: '/watched', page: LibraryListPage, props: { list: 'watched' } },
  { path: '/profile', page: ProfilePage, access: 'user' },
  { path: '/login', page: AuthPage, props: { mode: 'login' }, ...GUEST_ONLY },
  { path: '/register', page: AuthPage, props: { mode: 'register' }, ...GUEST_ONLY },
];

export const notFound = { page: NotFoundPage, layout: 'bare' };
