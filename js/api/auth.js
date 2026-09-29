export const API_BASE_URL = 'http://localhost:8080';



export const apiRequest = async (path, { method = 'GET', params, body, headers = {} } = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`);
  const upperMethod = method.toUpperCase();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  const init = { method: upperMethod, headers: { ...headers } };

  if (body != null && upperMethod !== 'GET' && upperMethod !== 'HEAD') {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);

  const data = await res.json().catch(() => ({}));

  return { ok: res.ok, status: res.status, data };
};
