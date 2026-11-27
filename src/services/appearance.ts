import { readJson, watchPreferences, writeJson } from './storage.js';

export const APPEARANCE_KEY = 'frame:appearance';
export const ACCENTS = [
  { value: 'amber', label: 'Янтарь', color: '#e6a15c' },
  { value: 'wine', label: 'Вино', color: '#ce526b' },
  { value: 'mint', label: 'Мята', color: '#6cc4a8' },
  { value: 'lavender', label: 'Лаванда', color: '#9c8cf0' },
  { value: 'ice', label: 'Лёд', color: '#6fb7e8' },
  { value: 'rose', label: 'Роза', color: '#e89ab4' },
  { value: 'lime', label: 'Лайм', color: '#a8c66c' },
  { value: 'snow', label: 'Снег', color: '#e8e4dc' },
] as const;

export const BACKGROUNDS = [
  { value: 'graphite', label: 'Графит · зерно', color: '#171a21' },
  { value: 'midnight', label: 'Полночь', color: '#10172a' },
  { value: 'bordeaux', label: 'Бордо', color: '#2a1218' },
  { value: 'forest', label: 'Хвоя', color: '#11201a' },
  { value: 'sepia', label: 'Сепия', color: '#2a2218' },
  { value: 'plum', label: 'Слива', color: '#221530' },
] as const;

const THEMES = {
  graphite: { sidebar: '#030508', glow: 'transparent' },
  midnight: { sidebar: '#050812', glow: 'rgba(51,89,217,0.3)' },
  bordeaux: { sidebar: '#14070b', glow: 'rgba(128,23,43,0.35)' },
  forest: { sidebar: '#050c09', glow: 'rgba(38,140,97,0.3)' },
  sepia: { sidebar: '#100c08', glow: 'rgba(166,107,38,0.3)' },
  plum: { sidebar: '#0d0814', glow: 'rgba(122,51,178,0.3)' },
};

export interface Appearance {
  accent: (typeof ACCENTS)[number]['value'];
  background: (typeof BACKGROUNDS)[number]['value'];
  grain: boolean;
  textSize: 'small' | 'normal' | 'large';
  transparency: number;
  compact: boolean;
  reduceMotion: boolean;
  cinema: 'none' | 'coraline';
}

const DEFAULTS: Appearance = {
  accent: 'amber',
  background: 'graphite',
  grain: true,
  textSize: 'normal',
  transparency: 30,
  compact: false,
  reduceMotion: false,
  cinema: 'none',
};

/** Проверяет локальные настройки перед применением CSS-переменных. */
export function readAppearance(): Appearance {
  const raw = readJson<unknown>(APPEARANCE_KEY, DEFAULTS);
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    accent: ACCENTS.find((item) => item.value === value.accent)?.value ?? DEFAULTS.accent,
    background:
      BACKGROUNDS.find((item) => item.value === value.background)?.value ?? DEFAULTS.background,
    grain: typeof value.grain === 'boolean' ? value.grain : DEFAULTS.grain,
    textSize: value.textSize === 'small' || value.textSize === 'large' ? value.textSize : 'normal',
    transparency:
      typeof value.transparency === 'number' && Number.isFinite(value.transparency)
        ? Math.min(80, Math.max(0, Math.round(value.transparency)))
        : DEFAULTS.transparency,
    compact: value.compact === true,
    reduceMotion: value.reduceMotion === true,
    cinema: value.cinema === 'coraline' ? 'coraline' : 'none',
  };
}

export function saveAppearance(patch: Partial<Appearance>) {
  if (patch.cinema === undefined && (patch.accent || patch.background))
    patch = { ...patch, cinema: 'none' };
  return writeJson(APPEARANCE_KEY, { ...readAppearance(), ...patch });
}

let previousPalette = '';
let fade: HTMLElement | null = null;

/** Применяет временное значение ползунка; постоянная запись выполняется при change. */
export function previewAppearance(patch: Partial<Appearance>) {
  applyAppearance({ ...readAppearance(), ...patch });
}

function applyAppearance(value = readAppearance()) {
  const root = document.documentElement;
  const palette = `${value.accent}:${value.background}:${value.cinema}`;
  const layout = document.querySelector<HTMLElement>('.app-layout');
  const animate =
    previousPalette &&
    palette !== previousPalette &&
    layout &&
    !value.reduceMotion &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const oldBackground = animate ? getComputedStyle(layout).background : '';
  previousPalette = palette;
  const accent = ACCENTS.find((item) => item.value === value.accent)!;
  const textAccent = accent.value === 'wine' ? '#e68198' : accent.color;
  const background = BACKGROUNDS.find((item) => item.value === value.background)!;
  const theme = THEMES[value.background];
  root.style.setProperty(
    '--surface-sidebar',
    value.cinema === 'coraline' ? '#0f1026' : theme.sidebar,
  );
  root.style.setProperty(
    '--page-background',
    `radial-gradient(ellipse 900px 500px at 50% 700px, ${theme.glow}, transparent), radial-gradient(ellipse 1000px 600px at 55% 0, rgba(230,161,92,0.045), transparent 75%), ${background.color}`,
  );
  delete root.dataset.colorMode;
  root.dataset.cinema = value.cinema;
  root.dataset.grain = String(value.grain);
  root.dataset.compact = String(value.compact);
  root.dataset.reduceMotion = String(value.reduceMotion);
  root.style.setProperty('--euphoria-amber', value.cinema === 'coraline' ? '#f5c542' : textAccent);
  root.style.setProperty(
    '--euphoria-amber-glow',
    `color-mix(in srgb, ${value.cinema === 'coraline' ? '#f5c542' : accent.color} 30%, transparent)`,
  );
  root.style.setProperty(
    '--accent-deep',
    value.cinema === 'coraline'
      ? '#f5c542'
      : accent.value === 'amber'
        ? '#bd763d'
        : accent.value === 'wine'
          ? '#ce6d84'
          : `color-mix(in srgb, ${accent.color} 85%, #080a0f)`,
  );
  root.style.setProperty(
    '--gradient-amber-from',
    value.cinema === 'coraline'
      ? '#f5c542'
      : accent.value === 'amber'
        ? '#f2b878'
        : `color-mix(in srgb, ${textAccent} 80%, white)`,
  );
  root.style.setProperty(
    '--gradient-amber-to',
    value.cinema === 'coraline'
      ? '#f5c542'
      : accent.value === 'amber'
        ? '#d08a47'
        : accent.value === 'wine'
          ? '#d87589'
          : `color-mix(in srgb, ${accent.color} 85%, #080a0f)`,
  );
  root.style.setProperty(
    '--border-subtle',
    value.cinema === 'coraline'
      ? 'rgba(160,160,205,0.35)'
      : `color-mix(in srgb, ${accent.color} 16%, transparent)`,
  );
  root.style.setProperty(
    '--border-active',
    `color-mix(in srgb, ${value.cinema === 'coraline' ? '#f5c542' : accent.color} 50%, transparent)`,
  );
  root.style.setProperty(
    '--surface-solid',
    value.cinema === 'coraline' ? '#161834' : background.color,
  );
  root.style.setProperty(
    '--bg-card',
    `color-mix(in srgb, ${value.cinema === 'coraline' ? '#1c1e42' : '#10121a'} ${100 - value.transparency}%, transparent)`,
  );
  const delta = value.textSize === 'large' ? 2 : value.textSize === 'small' ? -1 : 0;
  for (const token of ['body', 'small', 'control'])
    root.style.setProperty(`--text-${token}`, `${15 + delta}px`);
  root.style.setProperty('--text-meta', `${13 + delta}px`);
  if (animate && layout) {
    fade?.remove();
    const layer = document.createElement('div');
    layer.className = 'appearance-fade';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.background = oldBackground;
    layout.append(layer);
    fade = layer;
    const cleanup = () => {
      layer.remove();
      if (fade === layer) fade = null;
    };
    layer
      .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-out' })
      .finished.then(cleanup, cleanup);
  }
}

/** Применяет внешний вид и следит за изменением локальных настроек. */
export function startAppearance() {
  applyAppearance();
  watchPreferences(() => applyAppearance());
  window.addEventListener('storage', (event) => {
    if (event.key === APPEARANCE_KEY || event.key === null) applyAppearance();
  });
}
