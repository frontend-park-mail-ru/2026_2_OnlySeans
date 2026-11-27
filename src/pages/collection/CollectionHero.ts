import templateSource from './CollectionHero.hbs';
import { Component } from '../../core/component.js';
import { PosterStack } from '../../components/poster-stack/PosterStack.js';
import { loadAssets } from '../../core/assets.js';
import {
  type Collection,
  collectionHours,
  collectionShare,
  savedCollections,
  toggleCollection,
} from '../../services/collections.js';
import type { ShareDialog } from '../../components/share-dialog/ShareDialog.js';
import { notify } from '../../services/notice.js';
const template = await loadAssets({ template: templateSource });
export class CollectionHero extends Component<Collection & { href?: string; featured?: boolean }> {
  static template = template;
  #share: ShareDialog | null = null;
  #expanded = false;
  context() {
    return {
      ...this.props,
      longDescription: this.props.description.length > 160,
      expanded: this.#expanded,
      count: this.props.films.length,
      hours: collectionHours(this.props),
      saved: savedCollections().includes(String(this.props.id)),
      wheelHref:
        '/wheel?' +
        new URLSearchParams({
          pool: this.props.films
            .slice(0, 100)
            .map((film: { id: number }) => film.id)
            .join(','),
        }),
    };
  }
  onRender() {
    this.insert('posters', new PosterStack({ films: this.props.films, size: 'large' }));
    this.delegate('click', '[data-description-toggle]', (_, button) => {
      this.#expanded = !this.#expanded;
      this.find('.collection-hero__description').dataset.expanded = String(this.#expanded);
      button.setAttribute('aria-expanded', String(this.#expanded));
      button.textContent = this.#expanded ? 'Свернуть описание' : 'Читать описание';
    });
    this.delegate('click', '[data-save]', () => {
      try {
        toggleCollection(this.props.id);
        if (!this.destroyed) this.update();
      } catch (error) {
        notify(error.message, { type: 'error' });
      }
    });
    this.delegate('click', '[data-share]', async () => {
      try {
        const url = collectionShare(this.props);
        const { ShareDialog } = await import('../../components/share-dialog/ShareDialog.js');
        if (this.destroyed) return;
        this.#share = new ShareDialog({
          url,
          title: 'Поделиться подборкой',
          description:
            'Ссылка передаёт снимок списка. Последующие изменения по ней не синхронизируются.',
        }).open();
      } catch (error) {
        notify(error.message, { type: 'error' });
      }
    });
  }
  destroy() {
    this.#share?.close();
    super.destroy();
  }
}
