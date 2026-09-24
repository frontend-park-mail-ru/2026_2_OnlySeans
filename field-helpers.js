// Хелперы для полей формы.

function createField({ id, label, type = 'text', name = id, required = true }) {
  const wrap = document.createElement('div');
  wrap.className = 'field';

  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', id);
  labelEl.textContent = label;

  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.name = name;
  if (required) input.required = true;

  wrap.append(labelEl, input);
  return wrap;
}

function getFieldValue(fieldEl) {
  return fieldEl.querySelector('input').value.trim();
}

function setFieldError(fieldEl, message) {
  fieldEl.classList.toggle('field--invalid', Boolean(message));

  let hint = fieldEl.querySelector('.field__hint');
  if (!hint) {
    hint = document.createElement('span');
    hint.className = 'field__hint';
    fieldEl.appendChild(hint);
  }
  hint.textContent = message || '';
}