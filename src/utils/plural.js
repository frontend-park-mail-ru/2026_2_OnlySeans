// pluralize(5, ['фильм', 'фильма', 'фильмов']) → 'фильмов'
export const pluralize = (count, [one, few, many]) => {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return many;
  if (lastDigit === 1) return one;
  if (lastDigit >= 2 && lastDigit <= 4) return few;
  return many;
};
