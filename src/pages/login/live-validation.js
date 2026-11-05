import { setFieldError } from '../../components/ui/field/field.js';

export const setupLiveValidation = (form, submitButton, fields, onEdit) => {
  const touched = new Set();
  let submitting = false;
  const validate = (showAll = false) => {
    let valid = true;
    for (const { field, check, when } of fields) {
      const input = field.querySelector('input, textarea, select');
      const active = !when || when();
      const error = active ? check(input.value) || '' : '';
      if (error) valid = false;
      if (showAll) touched.add(field);
      const message = touched.has(field) && input.value.trim() ? error : '';
      setFieldError(field, message);
      input.setAttribute('aria-invalid', String(Boolean(message)));
      const hint = field.querySelector('.field__hint');
      hint.id = `${input.id}-hint`;
      hint.setAttribute('aria-live', 'polite');
      input.setAttribute('aria-describedby', hint.id);
    }
    submitButton.disabled = !valid || submitting;
    submitButton.classList.toggle('auth-submit--ready', valid && !submitting);
    return valid;
  };
  for (const { field } of fields) {
    const input = field.querySelector('input, textarea, select');
    const update = () => {
      touched.add(field);
      validate();
      onEdit?.();
    };
    input.addEventListener('input', update);
    input.addEventListener('change', update);
    input.addEventListener('blur', () => {
      touched.add(field);
      validate();
    });
  }
  form.addEventListener('reset', () => {
    touched.clear();
    queueMicrotask(() => validate());
  });
  validate();
  return {
    validate,
    isSubmitting: () => submitting,
    setSubmitting(value) {
      submitting = value;
      form.setAttribute('aria-busy', String(value));
      validate();
    },
  };
};
