import { loadText } from './assets.js';

export const Icon = Object.freeze({
  ALERT: 'alert',
  ARROW_LEFT: 'arrow-left',
  ARROW_RIGHT: 'arrow-right',
  CAPS_LOCK: 'caps-lock',
  CHECK: 'check',
  CLOCK: 'clock',
  CLOSE: 'close',
  EYE: 'eye',
  EYE_OFF: 'eye-off',
  FILMS: 'films',
  GRID: 'grid',
  HEART: 'heart',
  HOME: 'home',
  INFO: 'info',
  LIST: 'list',
  LOGOUT: 'logout',
  SERIES: 'series',
  SIDEBAR: 'sidebar',
  USER: 'user',
});

export const icons = Object.fromEntries(
  await Promise.all(
    Object.values(Icon).map(async (name) => [
      name,
      await loadText(new URL(`../assets/icons/${name}.svg`, import.meta.url)),
    ]),
  ),
);
