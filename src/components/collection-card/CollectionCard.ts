import './collection-card.css';
import templateSource from './CollectionCard.hbs';
import { Component } from '../../core/component.js';
import { countLabel } from '../../core/format.js';
import { PosterStack } from '../poster-stack/PosterStack.js';
import { loadAssets } from '../../core/assets.js';
import {
  type Collection,
  collectionHours,
  savedCollections,
  toggleCollection,
} from '../../services/collections.js';
import { notify } from '../../services/notice.js';
import type { RandomMovie } from './RandomMovie.js';
const template = await loadAssets({ template: templateSource });
export class CollectionCard extends Component<
  Collection & { href?: string; featured?: boolean; compact?: boolean }
> {
  static template = template;
  #random: RandomMovie | null = null;
  context() {
    return {
      ...this.props,
      size: this.props.compact ? 'compact' : 'full',
      count: countLabel(this.props.films.length, ['фильм', 'фильма', 'фильмов']),
      hours: collectionHours(this.props),
      saved: savedCollections().includes(String(this.props.id)),
    };
  }
  onRender() {
    this.insert('posters', new PosterStack({ films: this.props.films }));
    this.delegate('click', '[data-save]', () => {
      try {
        toggleCollection(this.props.id);
        if (!this.destroyed) this.update();
      } catch (error) {
        notify(error.message, { type: 'error' });
      }
    });
    this.delegate('click', '[data-random]', async () => {
      try {
        const { RandomMovie } = await import('./RandomMovie.js');
        if (!this.destroyed)
          this.#random = new RandomMovie({
            films: this.props.films,
            title: this.props.title,
          }).open();
      } catch {
        if (!this.destroyed)
          notify('Не удалось открыть случайный фильм. Повторите попытку.', { type: 'error' });
      }
    });
  }
  destroy() {
    this.#random?.close();
    super.destroy();
  }
}
