import { showNotice } from '../../../services/notice.js';
export const showFavoriteNotice = () => showNotice('Войдите, чтобы добавлять фильмы в избранное.', {type: 'error', duration: 3000});
