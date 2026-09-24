const THEME_KEY = 'theme';

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;

  // Пока пользователь ни разу не переключал тему сам — всегда тёмная,
  // независимо от системных настроек браузера/ОС.
  return 'dark';
}

function applyTheme(theme, iconEl) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if (iconEl) iconEl.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (iconEl) iconEl.textContent = '🌙';
  }
}

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