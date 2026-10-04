import { BaseComponent } from '../base-component.js';

const tabsTemplate = window.Handlebars.compile(`
  <div class="tabs" role="group" aria-label="{{label}}">
    {{#each items}}
      <button class="tabs__item" type="button" data-value="{{value}}" aria-pressed="false">{{label}}</button>
    {{/each}}
  </div>
`);

const selectTemplate = window.Handlebars.compile(`
  <label class="select">
    <span class="select__label">{{label}}</span>
    <select class="select__control">
      {{#each items}}<option value="{{value}}">{{label}}</option>{{/each}}
    </select>
  </label>
`);

export class Tabs extends BaseComponent {
  constructor({ label, items, value = '', onChange }) {
    super(tabsTemplate, { label, items });
    this.value = value;
    this.onChange = onChange;
  }

  create() {
    if (this.element) return this.element;

    const element = super.create();
    const buttons = [...element.querySelectorAll('.tabs__item')];
    const update = () => buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.value === this.value));
    });

    element.addEventListener('click', (event) => {
      const button = event.target.closest('.tabs__item');
      if (!button) return;

      this.value = button.dataset.value;
      update();
      this.onChange(this.value);
    });
    update();

    return element;
  }
}

export class Select extends BaseComponent {
  constructor({ label, items, onChange }) {
    super(selectTemplate, { label, items });
    this.onChange = onChange;
  }

  create() {
    if (this.element) return this.element;

    const element = super.create();
    element.querySelector('select').addEventListener('change', (event) => this.onChange(event.target.value));

    return element;
  }
}

export const createTabs = (props) => new Tabs(props).render();

export const createSelect = (props) => new Select(props).render();

export const toItems = (values, allLabel) => [
  { value: '', label: allLabel },
  ...values.map((value) => ({ value, label: value })),
];
