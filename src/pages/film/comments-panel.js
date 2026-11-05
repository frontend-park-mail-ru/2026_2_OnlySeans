import { getFilmComments, createComment, updateComment, deleteComment } from '../../api/fandom.js';
import { createEntryFeed } from './entry-feed.js';
import { createSpoilerNotice } from './spoiler-notice.js';
import { handleDiscussionAccess } from './discussion-access.js';
import { element } from '../../utils/dom.js';
import { readLegacyReview, clearLegacyReview } from '../../services/axis-ratings.js';
export const createCommentsPanel = ({ filmId, page, navigate, refreshSummary, spoilers }) => {
  const panel = element('section', 'comments-panel');
  const sort = element('div', 'fandom-sort comments-sort');
  panel.setAttribute('aria-label', 'Отзывы о фильме');
  sort.setAttribute('role', 'group');
  sort.setAttribute('aria-label', 'Сортировка отзывов');
  let order = new URLSearchParams(location.search).get('sort') === 'popular' ? 'popular' : 'new';
  let feed;
  panel.append(createSpoilerNotice(), sort);
  const mount = () => {
    feed?.dispose();
    feed?.element.remove();
    feed = createEntryFeed({
      page,
      kind: 'comment',
      filmId,
      scope: 'comments',
      basePath: `/film/${filmId}/comments`,
      navigate,
      rootAtTop: true,
      replyLimit: 3,
      spoilers,
      loadPage: async (params, options) => {
        const data = await getFilmComments(filmId, { ...params, sort: order }, options);
        return { items: data.comments, total: data.roots_total };
      },
      create: async (values) => {
        const created = await createComment(filmId, values);
        if (!values.parent_id) clearLegacyReview(filmId);
        return created;
      },
      initialReview: () => readLegacyReview(filmId),
      update: updateComment,
      remove: deleteComment,
      onChanged: refreshSummary,
      onAccessError: (error) => handleDiscussionAccess(page, error),
    });
    panel.insertBefore(feed.element, sort);
    feed.element.insertBefore(sort, feed.element.querySelector('.thread-posts'));
    sort
      .querySelectorAll('button')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.sort === order)),
      );
    void feed.start();
  };
  for (const [value, label] of [
    ['new', 'Новые'],
    ['popular', 'Популярные'],
  ]) {
    const button = element('button', '', label);
    button.type = 'button';
    button.dataset.sort = value;
    button.addEventListener('click', () => {
      if (order === value) return;
      order = value;
      const url = new URL(location.href);
      url.searchParams.set('sort', order);
      url.searchParams.delete('page');
      navigate(`${url.pathname}${url.search}`, { render: false });
      panel.append(sort);
      mount();
    });
    sort.append(button);
  }
  mount();
  const observer = new MutationObserver(() => {
    if (page.isConnected) return;
    feed.dispose();
    observer.disconnect();
  });
  observer.observe(page.parentElement, { childList: true });
  return panel;
};
