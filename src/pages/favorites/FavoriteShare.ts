import templateSource from './FavoriteShare.hbs';
import { Modal } from '../../components/modal/Modal.js';
import { loadAssets } from '../../core/assets.js';
import { favoriteShare } from '../../services/favorites.js';
import { notify } from '../../services/notice.js';

const template = await loadAssets({ template: templateSource });
export class FavoriteShare extends Modal {
  static template = template;
  constructor(props: { ids: number[] }) {
    super(props);
  }
  context() {
    return { count: this.props.ids.length, url: favoriteShare(this.props.ids) };
  }
  onRender() {
    this.delegate('click', '[data-close]', () => this.close());
    this.delegate('click', '[data-copy]', async () => {
      try {
        await navigator.clipboard.writeText(favoriteShare(this.props.ids));
        notify('Ссылка скопирована');
      } catch {
        this.find<HTMLInputElement>('input').select();
        notify('Скопируйте выделенную ссылку');
      }
    });
  }
}
