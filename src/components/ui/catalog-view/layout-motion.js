import { stopViewTransition, trackViewTransition } from '../../../services/view-transitions.js';

let sequence = 0;
export const animateCatalogLayout = (grid, commit) => {
  stopViewTransition();
  const cards = [...grid.children];
  cards.forEach(card => { card.dataset.layoutCard = '';card.classList.remove('home-reveal-pending', 'home-revealed'); });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !cards.length) { commit();return; }
  if (!document.startViewTransition) {
    const before = cards.map(card => card.getBoundingClientRect());commit();
    cards.forEach((card, index) => {
      const after = card.getBoundingClientRect(), old = before[index];
      if (!after.width || !after.height || (old.top > innerHeight && after.top > innerHeight)) return;
      card.animate([
        { transformOrigin: '0 0', transform: `translate(${old.left - after.left}px,${old.top - after.top}px) scale(${old.width / after.width},${old.height / after.height})` },
        { transformOrigin: '0 0', transform: 'none' },
      ], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
    });return;
  }
  const root = document.documentElement, saved = [], id = ++sequence;
  const name = (element, value, kind) => {
    if (!element) return;
    saved.push([element, element.style.viewTransitionName, element.style.viewTransitionClass]);
    element.style.viewTransitionName = value;element.style.viewTransitionClass = kind;
  };
  name(grid, `layout-surface-${id}`, 'layout-surface');
  cards.forEach((card, index) => {
    name(card, `layout-card-${id}-${index}`, 'layout-card');
    name(card.querySelector('.movie-tile__cover'), `layout-poster-${id}-${index}`, 'layout-poster');
  });
  const pagination = grid.closest('.catalog-feed')?.querySelector('.pagination');name(pagination, `layout-pagination-${id}`, 'layout-surface');
  root.classList.add('catalog-layout-transition');
  const cleanup = () => {
    root.classList.remove('catalog-layout-transition');
    saved.forEach(([element, previousName, previousClass]) => { element.style.viewTransitionName = previousName;element.style.viewTransitionClass = previousClass; });
  };
  const transition = document.startViewTransition(commit);
  trackViewTransition(transition, cleanup);transition.ready.catch(() => {});
};
