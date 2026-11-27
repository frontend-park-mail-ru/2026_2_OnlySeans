import templateSource from './WheelShare.hbs';
import { Modal } from '../../components/modal/Modal.js';
import { loadAssets } from '../../core/assets.js';
import { wheelShare, type WheelResult } from '../../services/wheel.js';
import type { Film } from '../../api/films.js';
const template = await loadAssets({ template: templateSource });
export class WheelShare extends Modal {
  static template = template;
  constructor(props: { film: Film; result: WheelResult; films: Film[] }) {
    super(props);
  }
  context() {
    const result = this.props.result as WheelResult;
    const total = result.entries.reduce((sum, entry) => sum + entry.weight, 0);
    const url = wheelShare(result);
    return {
      ...this.props,
      url,
      telegram:
        'https://t.me/share/url?' + new URLSearchParams({ url, text: this.props.film.title }),
      whatsapp:
        'https://wa.me/?' + new URLSearchParams({ text: this.props.film.title + ' ' + url }),
      vk: 'https://vk.com/share.php?' + new URLSearchParams({ url, title: this.props.film.title }),
      participants: result.entries.map((entry) => ({
        title:
          (this.props.films as Film[]).find((film) => film.id === entry.id)?.title ||
          'Фильм недоступен',
        chance: Math.round((entry.weight / total) * 100),
      })),
    };
  }
  onRender() {
    this.delegate('click', '[data-close]', () => this.close());
    this.delegate('click', '[data-copy]', async () => {
      try {
        await navigator.clipboard.writeText(wheelShare(this.props.result));
        if (!this.destroyed) this.find('[data-status]').textContent = 'Ссылка скопирована';
      } catch {
        if (!this.destroyed) {
          this.find<HTMLInputElement>('[data-url]').select();
          this.find('[data-status]').textContent = 'Скопируйте выделенную ссылку';
        }
      }
    });
    this.delegate('change', '[name=participants]', (_, input) => {
      this.find('[data-participants]').hidden = !(input as HTMLInputElement).checked;
    });
    this.delegate('click', '[data-download]', async () => {
      const button = this.find<HTMLButtonElement>('[data-download]');
      button.disabled = true;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error();
        const gradient = ctx.createLinearGradient(0, 0, 1000, 600);
        gradient.addColorStop(0, '#10121a');
        gradient.addColorStop(1, '#26362b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1000, 600);
        ctx.fillStyle = '#e6a15c';
        ctx.font = '600 24px Manrope, sans-serif';
        ctx.fillText('ВЕЧЕР РЕШЁН', 48, 64);
        ctx.fillStyle = '#f5f3ef';
        ctx.font = '800 42px Manrope, sans-serif';
        let line = '';
        let y = 132;
        for (const word of this.props.film.title.split(' ')) {
          if (ctx.measureText(line + ' ' + word).width > 580 && line) {
            ctx.fillText(line, 48, y);
            line = word;
            y += 52;
            if (y > 280) break;
          } else line += (line ? ' ' : '') + word;
        }
        ctx.fillText(line, 48, y);
        ctx.font = '400 24px Manrope, sans-serif';
        ctx.fillStyle = '#b7b3bf';
        ctx.fillText('Колесо выбрало из ' + this.props.result.entries.length + ' фильмов', 48, 340);
        ctx.fillStyle = '#f5f3ef';
        ctx.font = '800 30px Manrope, sans-serif';
        ctx.fillText('Frame', 48, 550);
        if (this.props.film.poster) {
          try {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.src = this.props.film.poster;
            await image.decode();
            ctx.drawImage(image, 690, 56, 260, 390);
          } catch {
            /* Экспорт текста остаётся доступным, если сервер постера не разрешает CORS. */
          }
        }
        if (this.destroyed) return;
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        );
        if (!blob) throw new Error();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'frame-wheel.png';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch {
        if (!this.destroyed)
          this.find('[data-status]').textContent =
            'Не удалось скачать картинку. Ссылка на результат доступна для копирования.';
      } finally {
        if (!this.destroyed) button.disabled = false;
      }
    });
  }
}
