const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const RISE = [
  { opacity: 0, transform: 'translateY(10px)' },
  { opacity: 1, transform: 'none' },
];
const FADE = [{ opacity: 0 }, { opacity: 1 }];

export function arrive(element, { duration = 360, rise = true } = {}) {
  if (!element || reducedMotion() || document.hidden) return;
  element.animate(rise ? RISE : FADE, { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
}
