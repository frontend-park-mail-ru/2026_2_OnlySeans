import { CookieService } from '../utils/cookies.js';
import { stopViewTransition, trackViewTransition } from './view-transitions.js';

export const THEME_KEY = 'theme';
const THEME_COOKIE_OPTIONS = {
  path: '/',
  'max-age': 60 * 60 * 24 * 365,
  SameSite: 'Lax',
};

const isTheme = (value) => value === 'light' || value === 'dark';

export const getPreferredTheme = () => {
  const savedCookie = CookieService.get(THEME_KEY);
  if (isTheme(savedCookie)) return savedCookie;

  const legacyTheme = localStorage.getItem(THEME_KEY);
  if (isTheme(legacyTheme)) {
    CookieService.set(THEME_KEY, legacyTheme, THEME_COOKIE_OPTIONS);
    localStorage.removeItem(THEME_KEY);
    return legacyTheme;
  }

  return 'dark';
};

export const applyTheme = (theme, iconEl) => {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if (iconEl) iconEl.textContent = '\u2600';
  } else {
    document.documentElement.removeAttribute('data-theme');

    if (iconEl) iconEl.textContent = '☾';
  }
  document.querySelectorAll('.theme-toggle, #themeToggle').forEach(button => {
    const icon = button.querySelector('.theme-toggle__icon');
    if (icon) icon.textContent = theme === 'light' ? '☀' : '☾';
    button.setAttribute('aria-label', theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему');
  });
};

let transitionTimer;
let changing = false;
export const setTheme = async (theme, { origin } = {}) => {
  if (!isTheme(theme) || changing) return;
  stopViewTransition();
  CookieService.set(THEME_KEY, theme, THEME_COOKIE_OPTIONS);
  clearTimeout(transitionTimer);
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduced) {
    if (!reduced) root.classList.add('theme-transition');
    applyTheme(theme);
    transitionTimer = setTimeout(() => root.classList.remove('theme-transition'), 350);
    return;
  }

  const rect = origin?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : innerHeight / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  changing = true;
  root.classList.remove('theme-transition');
  root.classList.add('theme-wave');
  const buttons = [...document.querySelectorAll('.theme-toggle, #themeToggle')];
  buttons.forEach(button => button.setAttribute('aria-busy', 'true'));
  let animation;
  const cleanup = () => {
    animation?.cancel();
    root.classList.remove('theme-wave');
    buttons.forEach(button => button.removeAttribute('aria-busy'));
    changing = false;
  };
  const transition = document.startViewTransition(() => applyTheme(theme));
  trackViewTransition(transition, cleanup);
  try {
    await transition.ready;
    animation = root.animate({ clipPath: [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${radius}px at ${x}px ${y}px)`,
    ] }, {
      duration: 780,
      easing: 'cubic-bezier(.22,.61,.36,1)',
      pseudoElement: '::view-transition-new(theme-surface)',
    });
  } catch {
    // A new route can intentionally interrupt the wave.
  }
};

applyTheme(getPreferredTheme(), null);

document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('themeToggle');
  if (!themeToggleBtn) return;

  const themeIcon = themeToggleBtn.querySelector('.theme-toggle__icon') || themeToggleBtn;
  applyTheme(getPreferredTheme(), themeIcon);

  themeToggleBtn.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    void setTheme(theme, { origin: themeToggleBtn });
  });
});
