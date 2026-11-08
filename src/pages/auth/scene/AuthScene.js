import './auth-scene.css';
import templateSource from './AuthScene.hbs';
import { Component } from '../../../core/component.js';
import { getFilmPosters } from '../../../api/films.js';
import { loadAssets } from '../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const STRIPS = 3;
const FRAMES = 4;
const REPEATS = 3;

export class AuthScene extends Component {
  static template = template;

  context() {
    const films = this.props.films || [];
    const reels = Array.from({ length: STRIPS }, (_, reel) => {
      const frames = films.slice(reel * FRAMES, (reel + 1) * FRAMES).map((film, frame) => ({
        src: film.poster,
        title: film.title,
        code: `50${reel + 1}3 ▷ 0${frame + 1}A`,
      }));
      return { number: reel + 1, tiles: Array.from({ length: REPEATS }, () => frames) };
    });
    return { reels };
  }

  onRender() {
    this.on('dragstart', (event) => event.preventDefault());
    this.on('selectstart', (event) => event.preventDefault());
    if (this.props.films) return;
    const controller = new AbortController();
    this.watch(() => controller.abort());
    getFilmPosters(STRIPS * FRAMES, { signal: controller.signal })
      .then((films) => {
        if (!controller.signal.aborted) this.update({ films });
      })
      .catch(() => {});
  }
}
