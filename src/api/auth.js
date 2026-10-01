import { http } from '../utils/http.js';

export { API_BASE_URL } from '../utils/http.js';

export const apiRequest = (path, options = {}) => http.request(path, options);
