import { showFandomError } from '../../services/fandom-notice.js';

import { store } from '../../modules/store.js';

export const handleDiscussionAccess = (page, error) => {
  if (error.status !== 401) return;
  store.setState({ user: null });
  showFandomError(error);
  page.dispatchEvent(new CustomEvent('personallibrarychange'));
};
