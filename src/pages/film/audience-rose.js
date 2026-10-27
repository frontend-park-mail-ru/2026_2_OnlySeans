import { createReviewRose } from './review-rose.js';
import { element, countLabel } from './film-ui.js';
import { getFandom } from '../../api/fandom.js';
import { RATING_AXES } from '../../services/axis-ratings.js';
import { scoreWord } from './rating-picker.js';

const format = value => value.toFixed(1).replace('.', ',');

/** Роза средних зрительских оценок на странице фильма. */
export const createAudienceRose = ({ movie, signal }) => {
  const card = element('section', 'film-insight audience-rose');card.setAttribute('aria-labelledby', 'audience-rose-title');
  const title = element('h2', 'film-insight__title', 'Оценки зрителей');title.id = 'audience-rose-title';
  const body = element('div', 'audience-rose__body');card.append(title, body);
  const render = ratings => {
    const count = ratings?.count || 0;
    const side = element('div', 'audience-rose__side');
    const rose = createReviewRose({size:260});
    rose.update({...Object.fromEntries(RATING_AXES.map(({key}) => [key, ratings?.[key] ?? null])), overall: ratings?.overall});
    const rated = RATING_AXES.filter(({ key }) => Number.isFinite(ratings?.[key]));
    card.classList.toggle('is-empty', !rated.length && !Number.isFinite(ratings?.overall));
    if (Number.isFinite(ratings?.overall)) {
      const mean = ratings.overall;
      const score = element('p', 'audience-rose__score');score.append(element('strong', '', format(mean)), element('span', '', ` из 10 · ${scoreWord(mean)}`));
      side.append(score, element('p', 'audience-rose__count', `по ${countLabel(ratings.overall_count || 0, ['отзыву', 'отзывам', 'отзывам'])} с оценкой`));
    } else side.append(element('p', 'film-insight__text', 'Общую оценку пока не поставили. Её можно указать отдельно в своём отзыве.'));
    const rows = element('ul', 'audience-rose__bars');
    for (const {key, label} of RATING_AXES) {
      const value = ratings?.[key];const item = element('li', `audience-rose__bar audience-rose__bar--${key}`);
      const track = element('span', 'audience-rose__track');track.setAttribute('aria-hidden', 'true');
      const fill = element('span');fill.style.width = `${Number.isFinite(value) ? Math.min(100, Math.max(0, value * 10)) : 0}%`;track.append(fill);
      item.append(element('span', 'audience-rose__axis', label), track, element('strong', '', Number.isFinite(value) ? format(value) : '—'));rows.append(item);
    }
    side.append(rows);
    if (count && ratings.rewatch) side.append(element('p', 'audience-rose__rewatch', `↻ ${Math.round(ratings.rewatch / count * 100)}% пересмотрели бы`));
    body.replaceChildren(rose.element, side);
  };
  body.append(element('p', 'film-insight__text', 'Загружаем оценки…'));
  getFandom(movie.id, {signal}).then(summary => { if (!signal?.aborted) render(summary?.ratings); }).catch(error => {
    if (error.name !== 'AbortError') body.replaceChildren(element('p', 'film-insight__text', 'Не удалось загрузить оценки зрителей.'));
  });
  return card;
};
