let active;

// навигация и смена темы делят один слой анимации браузера
export const stopViewTransition = () => {
  const previous = active;
  active = null;
  previous?.transition.skipTransition();
  previous?.cleanup();
};

export const trackViewTransition = (transition, cleanup = () => {}) => {
  const entry = { transition, cleanup };
  active = entry;
  transition.finished
    .catch(() => {})
    .finally(() => {
      if (active !== entry) return;
      active = null;
      cleanup();
    });
};
