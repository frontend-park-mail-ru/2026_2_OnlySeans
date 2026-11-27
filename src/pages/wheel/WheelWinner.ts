import templateSource from './WheelWinner.hbs';
import { loadAssets } from '../../core/assets.js';
import { Modal } from '../../components/modal/Modal.js';
import type { Film } from '../../api/films.js';
import { wheelShare, type WheelResult } from '../../services/wheel.js';
import { notify } from '../../services/notice.js';
import { isSaved, toggleSaved } from '../../services/library.js';
import type { WheelShare } from './WheelShare.js';

const template = await loadAssets({ template: templateSource });

/** Результат вращения с настоящими данными фильма и переносимой ссылкой. */
export class WheelWinner extends Modal {
  static template = template;
  #share: WheelShare | null = null;

  constructor(props: {
    film: Film;
    result: WheelResult;
    films: Film[];
    rating?: number | null;
    replay: () => void;
  }) {
    super(props);
  }

  context() {
    const result = this.props.result as WheelResult;
    const total = result.entries.reduce((sum, entry) => sum + entry.weight, 0);
    return {
      ...this.props,
      chance: Math.round(
        ((result.entries.find((entry) => entry.id === result.winner)?.weight ?? 0) / total) * 100,
      ),
      share: wheelShare(result),
      participants: result.entries.map((entry) => ({
        film: (this.props.films as Film[]).find((film) => film.id === entry.id),
        chance: Math.round((entry.weight / total) * 100),
      })),
      saved: isSaved('watchlater', result.winner),
    };
  }

  onRender() {
    this.delegate('click', '[data-share-open]', async () => {
      try {
        const { WheelShare } = await import('./WheelShare.js');
        if (!this.destroyed)
          this.#share = new WheelShare(
            this.props as { film: Film; result: WheelResult; films: Film[] },
          ).open();
      } catch {
        if (!this.destroyed)
          notify('Не удалось открыть окно шаринга. Повторите попытку.', { type: 'error' });
      }
    });
    this.delegate('click', '[data-close]', () => this.close());
    this.delegate('click', '[data-replay]', () => {
      this.close();
      this.props.replay();
    });
    this.delegate('click', '[data-copy]', async () => {
      try {
        await navigator.clipboard.writeText(wheelShare(this.props.result));
        notify('Ссылка скопирована.');
      } catch {
        this.find<HTMLInputElement>('[data-share]').select();
        notify('Выделенная ссылка готова к копированию.');
      }
    });
    this.delegate('click', '[data-save]', async (_, button) => {
      const control = button as HTMLButtonElement;
      control.disabled = true;
      try {
        await toggleSaved('watchlater', this.props.film.id);
        control.textContent = isSaved('watchlater', this.props.film.id)
          ? 'В списке'
          : 'Смотреть позже';
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Не удалось сохранить фильм.', {
          type: 'error',
        });
      } finally {
        control.disabled = false;
      }
    });
    this.delegate('click', '[data-link]', () => this.close());
  }
  destroy() {
    this.#share?.close();
    super.destroy();
  }
}
