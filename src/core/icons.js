import { loadText } from './assets.js';

const NAMES = [
  'alert',
  'arrow-left',
  'arrow-right',
  'caps-lock',
  'check',
  'clock',
  'close',
  'eye',
  'eye-off',
  'films',
  'grid',
  'heart',
  'home',
  'info',
  'list',
  'logout',
  'series',
  'sidebar',
  'user',
];

export const icons = Object.fromEntries(
  await Promise.all(
    NAMES.map(async (name) => [
      name,
      await loadText(new URL(`../assets/icons/${name}.svg`, import.meta.url)),
    ]),
  ),
);
