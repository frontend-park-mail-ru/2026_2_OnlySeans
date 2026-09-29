// Хелперы для полей формы.

const fieldTemplate = Handlebars.compile(`
  <div class="field">
    <label for="{{id}}">{{label}}</label>
    <input type="{{type}}" id="{{id}}" name="{{name}}" {{#if required}}required{{/if}}>
  </div>
`);

export const createField = ({ id, label, type = 'text', name = id, required = true }) =>
  renderTemplate(fieldTemplate, { id, label, type, name, required });

export const getFieldValue = (fieldEl) => {
  return fieldEl.querySelector('input').value.trim();
};

export const setFieldError = (fieldEl, message) => {
  fieldEl.classList.toggle('field--invalid', Boolean(message));

  let hint = fieldEl.querySelector('.field__hint');
  if (!hint) {
    hint = document.createElement('span');
    hint.className = 'field__hint';
    fieldEl.appendChild(hint);
  }
  hint.textContent = message || '';
};
