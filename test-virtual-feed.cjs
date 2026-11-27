const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync(`${__dirname}/src/services/virtual-feed.ts`, 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const geometry = {};
new Function('exports', code)(geometry);

test('виртуальная лента находит строку по реальным высотам и границам', () => {
  const offsets = [0, 100, 350, 420];
  for (const [position, row] of [
    [-1, 0],
    [0, 0],
    [99, 0],
    [100, 1],
    [349, 1],
    [350, 2],
    [999, 2],
  ])
    assert.equal(geometry.rowAt(offsets, position), row);
});

test('окно включает запас, обрабатывает пустой список и ограничивается концом ленты', () => {
  assert.deepEqual(geometry.visibleRows([0], 0, 600, 600), { start: 0, end: 0 });
  const offsets = Array.from({ length: 1001 }, (_, i) => i * 100);
  assert.deepEqual(geometry.visibleRows(offsets, 50000, 600, 600), { start: 494, end: 513 });
  assert.deepEqual(geometry.visibleRows(offsets, -1000, 600, 600), { start: 0, end: 3 });
  assert.deepEqual(geometry.visibleRows(offsets, 99900, 600, 600), { start: 993, end: 1000 });
});
