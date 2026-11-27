declare const __API_ORIGIN__: string;

export const API_URL: string =
  (typeof __API_ORIGIN__ === 'string' && __API_ORIGIN__) || window.location.origin;
