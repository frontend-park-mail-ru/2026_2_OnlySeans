// Жёсткий лимит длины поля ввода в символах (кодовых точках, как считает сервер).
// Лишние символы просто не появляются: при наборе, вставке, перетаскивании и автозаполнении.
// Вставка длинного текста обрезается до остатка лимита.

const length = value => Array.from(value).length;
const head = (value, max) => {
  if (max <= 0) return '';
  let count = 0, index = 0;
  for (const char of value) { if (count === max) break;index += char.length;count++; }
  return value.slice(0, index);
};

/** Ограничивает input/textarea до max символов. onLimit() вызывается, когда ввод упёрся в лимит. */
export const limitTextInput = (input, max, { onLimit } = {}) => {
  input.dataset.maxChars = String(max);
  // Подсказка браузеру: maxLength считает UTF-16, это строже и никогда не превышает лимит сервера.
  input.maxLength = max * 2;
  const clamp = () => {
    if (length(input.value) <= max) return false;
    const end = input.selectionEnd ?? input.value.length;
    const before = head(input.value.slice(0, end), max);
    const rest = head(input.value.slice(end), Math.max(0, max - length(before)));
    input.value = before + rest;
    try { input.setSelectionRange(before.length, before.length); } catch { /* type=email не поддерживает выделение. */ }
    onLimit?.();
    return true;
  };
  input.addEventListener('beforeinput', event => {
    if (!event.inputType?.startsWith('insert') || event.isComposing) return;
    const data = event.data ?? event.dataTransfer?.getData('text/plain') ?? '';
    if (!data) return;
    let start = input.selectionStart, end = input.selectionEnd;
    if (start === null || end === null) return; // type=email: дорежем в обработчике input.
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
  // Страховка: автозаполнение, IME, старые браузеры, программная подстановка черновика.
  input.addEventListener('input', clamp);
  clamp();
  return { clamp };
};

