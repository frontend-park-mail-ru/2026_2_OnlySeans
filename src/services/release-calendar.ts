export const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/** Месяц календаря не зависит от наличия расписания премьер. */
export function calendarMonth(value: string | null, today = new Date()) {
  const valid = value && /^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(value);
  const date = valid
    ? new Date(Number(value.slice(0, 4)), Number(value.slice(5)) - 1, 1, 12)
    : new Date(today.getFullYear(), today.getMonth(), 1, 12);
  const first = (date.getDay() + 6) % 7;
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const count = Math.ceil((first + days) / 7) * 7;
  return {
    key: monthKey(date),
    title: new Intl.DateTimeFormat('ru', { month: 'long', year: 'numeric' })
      .format(date)
      .replace(/ г\.$/, ''),
    previous: monthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1, 12)),
    next: monthKey(new Date(date.getFullYear(), date.getMonth() + 1, 1, 12)),
    days: Array.from({ length: count }, (_, index) => {
      const day = new Date(date.getFullYear(), date.getMonth(), index - first + 1, 12);
      return {
        day: day.getDate(),
        current: day.getMonth() === date.getMonth(),
        today: day.toDateString() === today.toDateString(),
        date: `${monthKey(day)}-${String(day.getDate()).padStart(2, '0')}`,
      };
    }),
  };
}
