import { BaseComponent } from '../base-component.js';
import { createButton } from '../button/button.js';

const template = window.Handlebars.compile(`
  <div class="filter-list"><div class="filter-list__controls"></div><div class="filter-list__selected" aria-live="polite"></div></div>
`);

export class FilterList extends BaseComponent {
  constructor({ name, label, options, included = [], excluded = [], buttonsOnly = false }) {
    super(template, {});
    this.name = name;
    this.label = label;
    this.options = options;
    this.buttonsOnly = buttonsOnly;
    const known = new Set(options.map(({ id }) => id));
    this.excluded = new Set(excluded.filter((id) => known.has(id)));
    this.included = new Set(included.filter((id) => known.has(id) && !this.excluded.has(id)));
    if (buttonsOnly && this.excluded.size) {
      this.included = new Set(options.filter(({ id }) => !this.excluded.has(id) && (!included.length || this.included.has(id))).map(({ id }) => id));
      if (this.included.size) this.excluded.clear();
    }
  }
  create() {
    if (this.element) return this.element;
    const element = super.create();
    const controls = element.querySelector('.filter-list__controls');
    const title = document.createElement('div');
    title.className = 'filter-list__label';
    title.id = `filter-${this.name}-label`;
    title.textContent = this.label;
    controls.appendChild(title);
    const container = document.createElement(this.buttonsOnly ? 'div' : 'details');
    container.className = this.buttonsOnly ? 'filter-list__types' : 'filter-list__dropdown';
    container.setAttribute('aria-labelledby', title.id);
    if (!this.buttonsOnly) {
      const summary = document.createElement('summary');
      summary.textContent = 'Выберите из списка';
      summary.setAttribute('aria-label', `Открыть список: ${this.label}`);
      container.appendChild(summary);
      container.addEventListener('toggle', () => {
        if (container.open) element.closest('.movie-filters')?.querySelectorAll('details').forEach((other) => {
          if (other !== container) other.open = false;
        });
      });
      container.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { container.open = false; summary.focus(); }
      });
    }
    const options = document.createElement('div');
    options.className = 'filter-list__options';
    for (const { id, label } of this.options) {
      if (this.buttonsOnly) {
        const button = createButton({ text: label });
        button.className = 'filter-list__type';
        button.dataset.value = id;
        button.addEventListener('click', () => {
          this.excluded.clear();
          if (this.included.has(id)) this.included.delete(id);
          else this.included.add(id);
          this.renderSelected();
        });
        options.appendChild(button);
        continue;
      }
      const row = document.createElement('div');
      row.className = 'filter-list__option';
      const text = document.createElement('span');
      text.textContent = label;
      row.appendChild(text);
      for (const [mode, values, other] of [['included', this.included, this.excluded], ['excluded', this.excluded, this.included]]) {
        const button = createButton({ text: mode === 'included' ? '+' : '−' });
        button.className = mode === 'included' ? 'filter-list__add' : 'filter-list__exclude';
        button.dataset.value = id;
        button.dataset.mode = mode;
        button.setAttribute('aria-label', `${mode === 'included' ? 'Включить' : 'Исключить'}: ${label}`);
        button.title = mode === 'included' ? 'Включить в поиск' : 'Исключить из поиска';
        button.addEventListener('click', () => {
          if (values.has(id)) values.delete(id);
          else { other.delete(id); values.add(id); }
          this.renderSelected();
        });
        row.appendChild(button);
      }
      options.appendChild(row);
    }
    container.appendChild(options);
    controls.appendChild(container);
    this.renderSelected();
    return element;
  }
  renderSelected() {
    const selected = this.create().querySelector('.filter-list__selected');
    selected.replaceChildren();
    this.create().querySelectorAll('.filter-list__options button').forEach((button) => {
      const values = button.dataset.mode === 'excluded' ? this.excluded : this.included;
      button.setAttribute('aria-pressed', String(values.has(button.dataset.value)));
    });
    if (this.buttonsOnly) return;
    for (const [values, excluded] of [[this.included, false], [this.excluded, true]]) {
      for (const id of values) {
        const label = this.options.find((option) => option.id === id).label;
        const chip = createButton({ text: `${excluded ? '−' : '+'} ${label} ×` });
        chip.className = `filter-list__chip${excluded ? ' filter-list__chip--excluded' : ''}`;
        chip.dataset.value = id;
        chip.dataset.mode = excluded ? 'excluded' : 'included';
        chip.setAttribute('aria-label', `Убрать ${excluded ? 'исключение' : 'включение'}: ${label}`);
        chip.addEventListener('click', () => { values.delete(id); this.renderSelected(); });
        selected.appendChild(chip);
      }
    }
  }
  reset() {
    this.included.clear(); this.excluded.clear(); this.renderSelected();
    const dropdown = this.create().querySelector('details');
    if (dropdown) dropdown.open = false;
  }
}
