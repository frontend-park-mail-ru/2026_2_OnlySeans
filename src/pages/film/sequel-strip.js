import { element } from './film-ui.js';
import { matchCatalog, getSequelVerdict, franchisePosition, entryMinutes, formatDuration } from '../../services/franchise.js';
import { getRecap, readingMinutes } from '../../data/recaps.js';
import { getCatalog } from '../../services/catalog-cache.js';
import { readPersonalLibrary } from '../../services/personal-library.js';

const NAMES_SHOWN = 2;

/**
 * Компактная строка в шапке фильма для частей франшиз: «Часть 2 из 3», что посмотреть до,
 * что дальше и справка «что было раньше». Для самостоятельных фильмов и сериалов — null.
 */
export const createSequelStrip = ({ movie, page, signal }) => {
  if (movie.type === 'series') return null;
  const match = matchCatalog([movie]).entryFor(movie);
  if (!match) return null;
  const { franchise, entry } = match;
  const verdict = getSequelVerdict(franchise, entry), position = franchisePosition(franchise, entry);

  const strip = element('div', 'sequel-strip');strip.dataset.kind = verdict.kind;
  const badge = element('span', 'sequel-strip__badge', `Часть ${position.number} из ${position.total} · ${franchise.shortTitle}`);
  const text = element('p', 'sequel-strip__text');
  strip.append(badge, text);

  const titleNode = (item, catalog) => {
    const linked = catalog?.movieFor(franchise, item);
    if (!linked) return element('span', 'sequel-strip__title', `«${item.title}»`);
    const link = element('a', 'sequel-strip__title', `«${item.title}»`);link.href = `/film/${linked.id}`;link.dataset.link = '';return link;
  };
  const list = (items, catalog) => {
    const fragment = document.createDocumentFragment();
    items.slice(0, NAMES_SHOWN).forEach((item, index) => { if (index) fragment.append(', ');fragment.append(titleNode(item, catalog)); });
    if (items.length > NAMES_SHOWN) fragment.append(` и ещё ${items.length - NAMES_SHOWN}`);
    return fragment;
  };

  const fill = catalog => {
    const watched = new Set(readPersonalLibrary().watched);
    const seen = item => { const linked = catalog?.movieFor(franchise, item);return Boolean(linked && watched.has(linked.id)); };
    text.replaceChildren();
    if (verdict.kind === 'required') {
      const missing = verdict.required.filter(item => !seen(item));
      if (!missing.length) text.append(element('span', 'sequel-strip__ok', '✓ Предыдущие части просмотрены'));
      else {
        const minutes = missing.reduce((sum, item) => sum + entryMinutes(item), 0);
        text.append(element('strong', '', missing.length === 1 ? 'Сначала посмотрите ' : `Сначала ${missing.length} ${missing.length < 5 ? 'части' : 'частей'}: `), list(missing, catalog));
        if (minutes) text.append(element('span', 'sequel-strip__muted', ` · ≈ ${formatDuration(minutes)}`));
      }
    } else if (verdict.kind === 'recommended') {
      text.append(element('strong', '', 'Можно смотреть отдельно, '), 'но лучше знать ', list(verdict.recommended, catalog));
    } else if (verdict.kind === 'first') text.append(element('strong', '', 'Первая часть'), ' — с неё и начинайте');
    else text.append(element('strong', '', 'Самостоятельная история'), ' — предыдущие части не обязательны');
    if (position.next) text.append(element('span', 'sequel-strip__muted', ' · Дальше: '), titleNode(position.next, catalog));
  };
  fill(null);
  const refresh = () => getCatalog().then(movies => { if (strip.isConnected && !signal?.aborted) fill(matchCatalog(movies)); }).catch(() => { /* Без каталога названия остаются без ссылок. */ });
  void refresh();
  page?.addEventListener('personallibrarychange', () => { if (strip.isConnected) void refresh(); });

  const recap = verdict.kind !== 'first' && getRecap(franchise.id, entry.key);
  if (recap) {
    const details = element('details', 'sequel-strip__recap');
    const summary = element('summary', '', `Что было раньше · ${readingMinutes(recap)} мин`);
    const panel = element('div', 'sequel-strip__panel');
    const points = element('ul');points.append(...recap.map(line => element('li', '', line)));
    panel.append(element('p', 'sequel-strip__warning', 'Спойлеры к предыдущим частям — но не к этому фильму.'), points);
    details.append(summary, panel);strip.append(details);
  }
  return strip;
};
