interface ValidatedField {
  value: string;
  setError(message: string): void;
}
interface Rule {
  field: ValidatedField;
  check(value: string): string;
  active?: () => boolean;
}

/** Проверяет активные поля; сообщения показывает после касания или отправки формы. */
export class FormValidator {
  #rules;
  #touched = new Set();

  constructor(rules: Rule[]) {
    this.#rules = rules;
  }

  touch(field: ValidatedField) {
    this.#touched.add(field);
  }

  validate({ showAll = false } = {}) {
    let valid = true;
    for (const rule of this.#rules) {
      const isActive = !rule.active || rule.active();
      const error = isActive ? rule.check(rule.field.value) : '';
      if (error) valid = false;
      if (showAll && isActive) this.touch(rule.field);
      const visible = isActive && this.#touched.has(rule.field);
      rule.field.setError(visible ? error : '');
    }
    return valid;
  }
}
