export const getAuthReturnPath = () => {
  const raw = new URLSearchParams(location.search).get('returnTo');
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  try {
    const url = new URL(raw, location.origin);
    if (url.origin !== location.origin || /^\/(login|register)(\/|$)/.test(url.pathname))
      return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};
export const authPath = (mode, returnTo = getAuthReturnPath()) =>
  returnTo ? `/${mode}?${new URLSearchParams({ returnTo })}` : `/${mode}`;
export const loginForCurrentPage = () =>
  authPath('login', `${location.pathname}${location.search}${location.hash}`);
