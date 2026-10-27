let active;

// Navigation and palette changes share the browser's single transition layer.
export const stopViewTransition = () => {
  const previous = active;
  active = null;
  previous?.transition.skipTransition();
  previous?.cleanup();
};

export const trackViewTransition = (transition, cleanup = () => {}) => {
  const entry = { transition, cleanup };
  active = entry;
  transition.finished.catch(() => {}).finally(() => {
    if (active !== entry) return;
    active = null;
    cleanup();
  });
};
