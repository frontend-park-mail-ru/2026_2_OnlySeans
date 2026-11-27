/** Геометрия строк виртуальной ленты; offsets содержит также нижнюю границу списка. */
export function rowAt(offsets: number[], position: number) {
  let low = 0;
  let high = Math.max(0, offsets.length - 2);
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (offsets[middle] <= position) low = middle;
    else high = middle - 1;
  }
  return low;
}

export function visibleRows(offsets: number[], top: number, height: number, overscan: number) {
  if (offsets.length < 2) return { start: 0, end: 0 };
  return {
    start: rowAt(offsets, Math.max(0, top - overscan)),
    end: Math.min(offsets.length - 1, rowAt(offsets, top + height + overscan) + 1),
  };
}
