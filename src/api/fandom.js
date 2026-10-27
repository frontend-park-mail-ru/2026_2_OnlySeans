import { http } from '../utils/http.js';

const messages = {
  'administrator access required': 'Это действие доступно только администратору.',
  'thread not found': 'Тема удалена или не найдена.',
  'post not found': 'Сообщение удалено или не найдено.',
  'comment not found': 'Отзыв или ответ удалён либо не найден.',
  'film not found': 'Фильм не найден.',
};
export class FandomAPIError extends Error {
  constructor(status, message) { super(message);this.name = 'FandomAPIError';this.status = status; }
}
export const fandomErrorMessage = error => {
  if (error.status === 401) return 'Сессия завершилась. Войдите снова, чтобы продолжить.';
  if (messages[error.message]) return messages[error.message];
  if (error.status === 403) return 'Недостаточно прав для этого действия.';
  if (error.status === 400) return 'Проверьте заполнение полей: заголовок — 3–120 символов, текст — до 5000.';
  if (error.status === 404) return 'Запись больше недоступна.';
  if (error.status === 409) return 'Это действие уже выполнено. Обновите данные.';
  return 'Не удалось связаться с сервером. Попробуйте ещё раз.';
};
const request = async (path, options = {}) => {
  const { ok, status, data } = await http.request(`/api${path}`, options);
  if (!ok) throw new FandomAPIError(status, data?.error || `HTTP ${status}`);
  return data;
};
const id = value => encodeURIComponent(value);
const list = (path, params, options) => request(path, { ...options, params });
const write = (path, method, body, options) => request(path, { ...options, method, ...(body === undefined ? {} : { body }) });
export const getFandom = (filmId, options) => request(`/films/${id(filmId)}/fandom`, options);
export const getFandomThreads = (filmId, params, options) => list(`/films/${id(filmId)}/fandom/threads`, params, options);
export const createFandomThread = async (filmId, body, options) => (await write(`/films/${id(filmId)}/fandom/threads`, 'POST', body, options)).thread;
export const getThread = async (threadId, options) => (await request(`/threads/${id(threadId)}`, options)).thread;
export const updateThread = async (threadId, body, options) => (await write(`/threads/${id(threadId)}`, 'PATCH', body, options)).thread;
export const deleteThread = (threadId, options) => write(`/threads/${id(threadId)}`, 'DELETE', undefined, options);
export const createPost = async (threadId, body, options) => (await write(`/threads/${id(threadId)}/posts`, 'POST', body, options)).post;
export const updatePost = async (postId, body, options) => (await write(`/posts/${id(postId)}`, 'PATCH', body, options)).post;
export const deletePost = (postId, options) => write(`/posts/${id(postId)}`, 'DELETE', undefined, options);
export const setThreadReaction = (threadId, code, options) => write(`/threads/${id(threadId)}/reactions/${id(code)}`, 'PUT', undefined, options);
export const removeThreadReaction = (threadId, code, options) => write(`/threads/${id(threadId)}/reactions/${id(code)}`, 'DELETE', undefined, options);
export const setPostReaction = (postId, code, options) => write(`/posts/${id(postId)}/reactions/${id(code)}`, 'PUT', undefined, options);
export const removePostReaction = (postId, code, options) => write(`/posts/${id(postId)}/reactions/${id(code)}`, 'DELETE', undefined, options);
export const getMyFandoms = (params, options) => list('/me/fandoms', params, options);
export const getMyFandomFeed = (params, options) => list('/me/fandoms/feed', params, options);
export const getFilmComments = (filmId, params, options) => list(`/films/${id(filmId)}/comments`, params, options);
export const createComment = async (filmId, body, options) => (await write(`/films/${id(filmId)}/comments`, 'POST', body, options)).comment;
export const updateComment = async (commentId, body, options) => (await write(`/comments/${id(commentId)}`, 'PATCH', body, options)).comment;
export const deleteComment = (commentId, options) => write(`/comments/${id(commentId)}`, 'DELETE', undefined, options);
export const setCommentReaction = (commentId, code, options) => write(`/comments/${id(commentId)}/reactions/${id(code)}`, 'PUT', undefined, options);
export const removeCommentReaction = (commentId, code, options) => write(`/comments/${id(commentId)}/reactions/${id(code)}`, 'DELETE', undefined, options);

export const getThreadMessages = (threadId, params, options) => list(`/threads/${id(threadId)}/messages`, params, options);
