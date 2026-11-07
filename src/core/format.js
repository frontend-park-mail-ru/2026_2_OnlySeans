export const pluralize = (count, [one, few, many]) => {
  const tens = Math.abs(count) % 100;
  const units = tens % 10;
  if (tens > 10 && tens < 20) return many;
  if (units === 1) return one;
  if (units >= 2 && units <= 4) return few;
  return many;
};

export const countLabel = (count, forms) => `${count} ${pluralize(count, forms)}`;

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export function relativeDate(value, now = Date.now()) {
  const date = new Date(value);
  const difference = Math.max(0, now - date.getTime());
  if (!Number.isFinite(date.getTime()) || difference < 60_000) return 'Только что';
  const relative = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });
  if (difference < 3_600_000) return relative.format(-Math.floor(difference / 60_000), 'minute');
  if (difference < 86_400_000) return relative.format(-Math.floor(difference / 3_600_000), 'hour');
  if (difference < 604_800_000) return relative.format(-Math.floor(difference / 86_400_000), 'day');
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString('ru', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
