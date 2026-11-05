export const actorPath = (name) => `/actor/${encodeURIComponent(name)}`;
// Страницы режиссёров и продюсеров: /director/Имя, /producer/Имя.
export const personPath = (role, name) =>
  `/${role}/${encodeURIComponent(
    String(name)
      .replace(/\u00a0/g, ' ')
      .trim(),
  )}`;
