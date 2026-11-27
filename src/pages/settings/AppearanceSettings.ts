import templateSource from './AppearanceSettings.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import {
  ACCENTS,
  BACKGROUNDS,
  readAppearance,
  saveAppearance,
  previewAppearance,
  type Appearance,
} from '../../services/appearance.js';
import { notify } from '../../services/notice.js';
import { watchPreferences } from '../../services/storage.js';

const template = await loadAssets({ template: templateSource });
const asset = (name: string) =>
  String(new URL(`../../assets/images/settings/${name}`, import.meta.url));

/** Панель внешнего вида с предварительным просмотром ползунка без записи на каждом кадре. */
export class AppearanceSettings extends Component {
  static template = template;
  context() {
    return {
      value: readAppearance(),
      sizes: [
        { value: 'small', label: 'Мелкий' },
        { value: 'normal', label: 'Обычный' },
        { value: 'large', label: 'Крупный' },
      ],
      accents: ACCENTS,
      backgrounds: BACKGROUNDS,
      posters: [1, 2, 3, 4].map((index) => asset(`settings-poster-${index}.png`)),
      coraline: asset('settings-coraline.png'),
    };
  }
  onRender() {
    this.#sync();
    this.delegate('click', '[data-cinema]', () => {
      if (!saveAppearance({ cinema: readAppearance().cinema === 'coraline' ? 'none' : 'coraline' }))
        notify('Не удалось сохранить тему', { type: 'error' });
      this.#sync();
    });
    this.on('input', (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.name !== 'transparency') return;
      previewAppearance({ transparency: input.valueAsNumber });
      this.find('output').textContent = `${input.value} %`;
    });
    this.on('change', (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      const patch: Partial<Appearance> = {};
      if (input.name === 'textSize' && ['small', 'normal', 'large'].includes(input.value))
        patch.textSize = input.value as Appearance['textSize'];
      if (input.name === 'accent')
        patch.accent = ACCENTS.find((item) => item.value === input.value)?.value;
      if (input.name === 'background')
        patch.background = BACKGROUNDS.find((item) => item.value === input.value)?.value;
      if (input.name === 'transparency') patch.transparency = input.valueAsNumber;
      if (input.name === 'grain') patch.grain = input.checked;
      if (input.name === 'compact') patch.compact = input.checked;
      if (input.name === 'reduceMotion') patch.reduceMotion = input.checked;
      if (Object.keys(patch).length && !saveAppearance(patch)) {
        previewAppearance({});
        notify('Не удалось сохранить настройки на устройстве.', { type: 'error' });
      }
      this.#sync();
    });
    this.watch(watchPreferences(() => this.#sync()));
    this.on('storage', () => this.#sync(), window);
    this.watch(() => previewAppearance({}));
  }
  #sync() {
    const value = readAppearance();
    this.find('[data-cinema]').setAttribute('aria-pressed', String(value.cinema === 'coraline'));
    this.findAll<HTMLInputElement>('input').forEach((input) => {
      const saved = value[input.name as keyof Appearance];
      if (input.type === 'radio') input.checked = input.value === saved;
      if (input.type === 'checkbox') input.checked = saved === true;
      if (input.type === 'range') input.value = String(saved);
    });
    this.find('output').textContent = `${value.transparency} %`;
  }
}
