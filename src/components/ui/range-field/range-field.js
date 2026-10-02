import { BaseComponent } from '../base-component.js';

const template = window.Handlebars.compile(`
  <fieldset class="range-field">
    <legend>{{label}}</legend>
    <div class="range-field__values">
      <label for="{{name}}-from">От <output for="{{name}}-from">{{from}}</output></label>
      <label for="{{name}}-to">До <output for="{{name}}-to">{{to}}</output></label>
    </div>
    <div class="range-field__slider">
      <div class="range-field__track" aria-hidden="true"><div class="range-field__selection"></div></div>
      <input id="{{name}}-from" type="range" min="{{min}}" max="{{max}}" step="{{step}}" value="{{from}}" aria-label="{{label}}: от">
      <input id="{{name}}-to" type="range" min="{{min}}" max="{{max}}" step="{{step}}" value="{{to}}" aria-label="{{label}}: до">
    </div>
  </fieldset>
`);

export class RangeField extends BaseComponent {
  constructor({ name, label, min, max, step = 1, from = min, to = max }) {
    const clamp = (value) => Math.max(min, Math.min(max, Number(value)));
    const start = clamp(from);
    super(template, { name, label, min, max, step, from: start, to: Math.max(start, clamp(to)) });
  }
  create() {
    if (this.element) return this.element;
    const element = super.create();
    const [from, to] = element.querySelectorAll('input');
    element.addEventListener('input', (event) => {
      if (Number(from.value) > Number(to.value)) {
        if (event.target === from) to.value = from.value;
        else from.value = to.value;
      }
      this.updateOutputs();
    });
    const slider = element.querySelector('.range-field__slider');
    let activeInput = null;
    const moveHandle = (event) => {
      const bounds = slider.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (event.clientX - bounds.left - 9) / (bounds.width - 18)));
      const { min, max, step } = this.props;
      const value = min + Math.round(fraction * (max - min) / step) * step;
      if (!activeInput) activeInput = Math.abs(value - Number(from.value)) < Math.abs(value - Number(to.value)) ? from : to;
      activeInput.value = value;
      activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    };
    slider.addEventListener('pointerdown', (event) => {
      if (event.target.tagName === 'INPUT' || event.button !== 0) return;
      event.preventDefault();
      moveHandle(event);
      activeInput.focus();
      slider.setPointerCapture(event.pointerId);
    });
    slider.addEventListener('pointermove', (event) => { if (activeInput) moveHandle(event); });
    slider.addEventListener('pointerup', () => { activeInput = null; });
    slider.addEventListener('pointercancel', () => { activeInput = null; });
    this.updateOutputs();
    return element;
  }
  updateOutputs() {
    const element = this.create();
    element.querySelectorAll('input').forEach((input, index) => {
      element.querySelectorAll('output')[index].textContent = input.value;
    });
    const [from, to] = element.querySelectorAll('input');
    const percent = (value) => (Number(value) - this.props.min) / (this.props.max - this.props.min) * 100;
    element.style.setProperty('--range-from', `${percent(from.value)}%`);
    element.style.setProperty('--range-to', `${percent(to.value)}%`);
    // When both handles meet at the upper end, keep the lower handle reachable.
    from.style.zIndex = Number(from.value) === this.props.max ? '4' : '2';
  }
  reset() {
    const [from, to] = this.create().querySelectorAll('input');
    from.value = this.props.min;
    to.value = this.props.max;
    this.updateOutputs();
  }
}
