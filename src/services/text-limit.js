const length = (value) => Array.from(value).length;
const head = (value, max) => {
  if (max <= 0) return '';
  let count = 0;
  let index = 0;
  for (const char of value) {
    if (count === max) break;
    index += char.length;
    count++;
  }
  return value.slice(0, index);
};

export const limitTextInput = (input, max, { onLimit } = {}) => {
  input.dataset.maxChars = String(max);

  input.maxLength = max * 2;
  const clamp = () => {
    if (length(input.value) <= max) return false;
    const end = input.selectionEnd ?? input.value.length;
    const before = head(input.value.slice(0, end), max);
    const rest = head(input.value.slice(end), Math.max(0, max - length(before)));
    input.value = before + rest;
    if (input.selectionStart !== null) input.setSelectionRange(before.length, before.length);
    onLimit?.();
    return true;
  };
  input.addEventListener('beforeinput', (event) => {
    if (!event.inputType?.startsWith('insert') || event.isComposing) return;
    const data = event.data ?? event.dataTransfer?.getData('text/plain') ?? '';
    if (!data) return;
    let start = input.selectionStart;
    let end = input.selectionEnd;
    if (start === null || end === null) return;
    const remaining = max - (length(input.value) - length(input.value.slice(start, end)));
    const insert = event.inputType === 'insertLineBreak' ? '\n' : data;
    if (length(insert) <= remaining) return;
    event.preventDefault();
    const fitted = head(insert, Math.max(0, remaining));
    if (fitted) {
      input.setRangeText(fitted, start, end, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    onLimit?.();
  });

  input.addEventListener('input', clamp);
  clamp();
  return { clamp };
};
