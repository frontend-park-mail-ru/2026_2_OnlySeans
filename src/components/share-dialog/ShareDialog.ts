import templateSource from './ShareDialog.hbs';
import { Modal } from '../modal/Modal.js';
import { loadAssets } from '../../core/assets.js';
const template = await loadAssets({ template: templateSource });
export class ShareDialog extends Modal {
  static template = template;
  constructor(props: { url: string; title: string; description?: string }) {
    super(props);
  }
  onRender() {
    this.delegate('click', '[data-close]', () => this.close());
    this.delegate('click', '[data-copy]', async () => {
      const input = this.find<HTMLInputElement>('input');
      try {
        await navigator.clipboard.writeText(input.value);
        if (!this.destroyed) this.find('[data-status]').textContent = 'Ссылка скопирована';
      } catch {
        if (!this.destroyed) {
          input.select();
          this.find('[data-status]').textContent = 'Скопируйте выделенную ссылку вручную';
        }
      }
    });
  }
}
