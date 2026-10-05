import { CookieService } from '../utils/cookies.js';

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

    if (iconEl) iconEl.textContent = '\u1F319';
  }
};

let transitionTimer;
export const setTheme = (theme) => {
  if (!isTheme(theme)) return;
  CookieService.set(THEME_KEY, theme, THEME_COOKIE_OPTIONS);
  clearTimeout(transitionTimer);
  document.documentElement.classList.add('theme-transition');
  applyTheme(theme);
  transitionTimer = setTimeout(() => document.documentElement.classList.remove('theme-transition'), 900);
};

let currentTheme = getPreferredTheme();
applyTheme(currentTheme, null);

document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('themeToggle');
  if (!themeToggleBtn) return;

  const themeIcon = themeToggleBtn.querySelector('.theme-toggle__icon') || themeToggleBtn;
  applyTheme(currentTheme, themeIcon);

  themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    CookieService.set(THEME_KEY, currentTheme, THEME_COOKIE_OPTIONS);
    applyTheme(currentTheme, themeIcon);
  });
});
