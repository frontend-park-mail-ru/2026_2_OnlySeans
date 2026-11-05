const BACKWARD_KEYS = new Set(['ArrowUp', 'ArrowLeft']);

// Home — первый пункт, End — последний, стрелки ходят по кругу
export const nextFocusIndex = (key, currentIndex, count) => {
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  const step = BACKWARD_KEYS.has(key) ? -1 : 1;
  return (currentIndex + step + count) % count;
};
