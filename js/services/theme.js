export const THEME_KEY = 'theme';

export const getPreferredTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  return (saved === 'light' || saved === 'dark') ? saved : 'dark';
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

let currentTheme = getPreferredTheme();
applyTheme(currentTheme, null);

document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('themeToggle');
  if (!themeToggleBtn) return;

  const themeIcon = themeToggleBtn.querySelector('.theme-toggle__icon') || themeToggleBtn;
  applyTheme(currentTheme, themeIcon);

  themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, currentTheme);
    applyTheme(currentTheme, themeIcon);
  });
});
