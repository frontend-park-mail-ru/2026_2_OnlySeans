import { Component } from '../../../core/component.js';
import { loadStyles, loadTemplate } from '../../../core/assets.js';

loadStyles(new URL('./auth-scene.css', import.meta.url));
const template = await loadTemplate(new URL('./AuthScene.hbs', import.meta.url));

const poster = (name) =>
  new URL(`../../../assets/images/auth/posters/${name}.jpg`, import.meta.url).href;

const REELS = [
  [
    ['shawshank', 'Побег из Шоушенка'],
    ['interstellar', 'Интерстеллар'],
    ['lion-king', 'Король Лев'],
    ['gentlemen', 'Джентльмены'],
  ],
  [
    ['inception', 'Начало'],
    ['sherlock', 'Шерлок'],
    ['green-mile', 'Зелёная миля'],
    ['home-alone', 'Один дома'],
  ],
  [
    ['breaking-bad', 'Во все тяжкие'],
    ['forrest-gump', 'Форрест Гамп'],
    ['shutter-island', 'Остров проклятых'],
    ['ivan-vasilievich', 'Иван Васильевич меняет профессию'],
  ],
];

const REPEATS = 3;

export class AuthScene extends Component {
  static template = template;

  context() {
    const reels = REELS.map((films, reel) => {
      const frames = films.map(([name, title], frame) => ({
        src: poster(name),
        title,
        code: `50${reel + 1}3 ▷ 0${frame + 1}A`,
      }));
      return { number: reel + 1, tiles: Array.from({ length: REPEATS }, () => frames) };
    });
    return { reels };
  }

  onRender() {
    this.on('dragstart', (event) => event.preventDefault());
    this.on('selectstart', (event) => event.preventDefault());
  }
}
