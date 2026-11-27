const isAuthPage = (path: string) => /^\/(login|register)(\/|$)/.test(path);

export function getReturnPath() {
  const raw = new URLSearchParams(location.search).get('returnTo');
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  const url = new URL(raw, location.origin);
  if (url.origin !== location.origin || isAuthPage(url.pathname)) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

export const authPath = (mode: 'login' | 'register', returnTo = getReturnPath()) => {
  const query = new URLSearchParams();
  if (returnTo) query.set('returnTo', returnTo);
  if (
    isAuthPage(location.pathname) &&
    new URLSearchParams(location.search).get('layout') === 'centered'
  )
    query.set('layout', 'centered');
  return `/${mode}${query.size ? '?' + query : ''}`;
};

export const loginPathHere = () => authPath('login', `${location.pathname}${location.search}`);
