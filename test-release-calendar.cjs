const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exportsCalendar = {};
const source = fs.readFileSync(`${__dirname}/src/services/release-calendar.ts`, 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
new Function('exports', code)(exportsCalendar);
const { calendarMonth } = exportsCalendar;

test('календарь начинается с понедельника, сохраняет високосный день и полные недели', () => {
  const month = calendarMonth('2024-02', new Date(2024, 1, 29, 12));
  assert.equal(month.days.length, 35);
  assert.equal(month.days[0].date, '2024-01-29');
  assert.equal(month.days.at(-1).date, '2024-03-03');
  assert.equal(month.days.filter((day) => day.current).length, 29);
  assert.equal(month.days.find((day) => day.today).date, '2024-02-29');
});
test('переходы месяцев правильно пересекают год, длинный месяц занимает шесть недель', () => {
  assert.equal(calendarMonth('2026-12').next, '2027-01');
  assert.equal(calendarMonth('2026-01').previous, '2025-12');
  assert.equal(calendarMonth('2026-03').days.length, 42);
});
test('некорректный месяц и выход за диапазон заменяются текущим месяцем', () => {
  const now = new Date(2026, 10, 27, 12);
  for (const value of [null, '', '2026-13', '2026-2', '1899-12', '2100-01', '2026-02x'])
    assert.equal(calendarMonth(value, now).key, '2026-11');
});
