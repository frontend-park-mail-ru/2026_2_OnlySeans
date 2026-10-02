import { store } from '../modules/store.js';

const DEMO_SESSION_KEY = 'onlyseans:demo-session';

export function initializeDemoSession() {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) return;
  const mode = new URLSearchParams(window.location.search).get('demo');
  let enabled = mode === '1';
  try {
    if (mode === '1') sessionStorage.setItem(DEMO_SESSION_KEY, '1');
    if (mode === '0') sessionStorage.removeItem(DEMO_SESSION_KEY);
    enabled = sessionStorage.getItem(DEMO_SESSION_KEY) === '1';
  } catch { /* The link also works without session storage. */ }
  if (enabled) store.setState({ user: { id: 'demo', username: 'Демо-пользователь' } });
}
