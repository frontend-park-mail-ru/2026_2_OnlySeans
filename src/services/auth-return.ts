const isAuthPage = (path) => /^\/(login|register)(\/|$)/.test(path);

export function getReturnPath() {
  const raw = new URLSearchParams(location.search).get('returnTo');
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  const url = new URL(raw, location.origin);
  if (url.origin !== location.origin || isAuthPage(url.pathname)) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

export const authPath = (mode, returnTo = getReturnPath()) =>
  returnTo ? `/${mode}?${new URLSearchParams({ returnTo })}` : `/${mode}`;

export const loginPathHere = () => authPath('login', `${location.pathname}${location.search}`);
