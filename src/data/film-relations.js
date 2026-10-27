import { matchCatalog } from '../services/franchise.js';

/** Existing catalogue films before/after this entry in story order.
 * Reuse the shared franchise definitions used by the viewing-order guide.
 */
export const getFilmRelations = (movie, catalog) => {
  const matches = matchCatalog(catalog);
  const match = matches.entryFor(movie);
  if (!match) return {prequels: [], sequels: []};
  const {franchise, entry} = match;
  const ordered = franchise.entries.filter(item => item.kind !== 'anthology').sort((a, b) => (a.chrono ?? a.year) - (b.chrono ?? b.year) || a.year - b.year);
  const current = ordered.findIndex(item => item.key === entry.key);
  if (current < 0) return {prequels: [], sequels: []};
  const available = entries => entries.map(item => matches.movieFor(franchise, item)).filter(item => item && item.id !== movie.id);
  return {prequels: available(ordered.slice(0, current)), sequels: available(ordered.slice(current + 1))};
};
