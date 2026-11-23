export class FormValidator {
  #rules;
  #touched = new Set();

  constructor(rules) {
    this.#rules = rules;
  }

  touch(field) {
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
