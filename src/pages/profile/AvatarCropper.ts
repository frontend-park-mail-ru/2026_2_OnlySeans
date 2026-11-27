import './avatar-cropper.css';
import templateSource from './AvatarCropper.hbs';
import { Modal } from '../../components/modal/Modal.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

/** Кадрирование выполняется на устройстве; исходное фото не загружается до сохранения профиля. */
export class AvatarCropper extends Modal {
  static template = template;
  #image = new Image();
  #url = '';
  #zoom = 1;
  #angle = 0;
  #x = 0;
  #y = 0;
  #ready = false;
  #drag: { x: number; y: number } | null = null;

  constructor(props: { file: File; onApply(file: File): void }) {
    super(props);
  }

  onRender() {
    this.#url = URL.createObjectURL(this.props.file);
    this.#image.src = this.#url;
    void this.#image
      .decode()
      .then(() => {
        if (this.destroyed) return;
        this.#ready = true;
        this.#draw();
        this.find<HTMLButtonElement>('[data-save]').disabled = false;
      })
      .catch(() => {
        if (!this.destroyed)
          this.find('[data-error]').textContent =
            'Не удалось открыть изображение. Выберите другое фото.';
      });
    this.delegate('click', '[data-close]', () => this.close());
    this.delegate('click', '[data-rotate]', () => {
      this.#angle = (this.#angle + 90) % 360;
      this.#x = 0;
      this.#y = 0;
      this.#draw();
    });
    this.delegate('input', '[data-zoom]', (_, input) => {
      this.#zoom = Number((input as HTMLInputElement).value);
      this.#draw();
    });
    const canvas = this.find<HTMLCanvasElement>('[data-crop]');
    this.on(
      'pointerdown',
      (event) => {
        if (!this.#ready) return;
        canvas.setPointerCapture(event.pointerId);
        this.#drag = { x: event.clientX, y: event.clientY };
      },
      canvas,
    );
    this.on(
      'pointermove',
      (event) => {
        if (!this.#drag) return;
        const scale = 512 / canvas.getBoundingClientRect().width;
        this.#x += (event.clientX - this.#drag.x) * scale;
        this.#y += (event.clientY - this.#drag.y) * scale;
        this.#drag = { x: event.clientX, y: event.clientY };
        this.#draw();
      },
      canvas,
    );
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'] as const)
      this.on(
        event,
        () => {
          this.#drag = null;
        },
        canvas,
      );
    this.on(
      'keydown',
      (event) => {
        const steps: Record<string, [number, number]> = {
          ArrowLeft: [-12, 0],
          ArrowRight: [12, 0],
          ArrowUp: [0, -12],
          ArrowDown: [0, 12],
        };
        const step = steps[event.key];
        if (!step) return;
        event.preventDefault();
        this.#x += step[0];
        this.#y += step[1];
        this.#draw();
      },
      canvas,
    );
    this.delegate('click', '[data-save]', () => {
      if (!this.#ready) return;
      canvas.toBlob(
        (blob) => {
          if (!blob || this.destroyed) return;
          this.props.onApply(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
          this.close();
        },
        'image/jpeg',
        0.92,
      );
    });
  }

  #draw() {
    if (!this.#ready) return;
    const canvas = this.find<HTMLCanvasElement>('[data-crop]');
    const context = canvas.getContext('2d');
    if (!context) return;
    const rotated = this.#angle % 180 !== 0;
    const width = rotated ? this.#image.naturalHeight : this.#image.naturalWidth;
    const height = rotated ? this.#image.naturalWidth : this.#image.naturalHeight;
    const scale = Math.max(512 / width, 512 / height) * this.#zoom;
    const limitX = Math.max(0, (width * scale - 512) / 2);
    const limitY = Math.max(0, (height * scale - 512) / 2);
    this.#x = Math.max(-limitX, Math.min(limitX, this.#x));
    this.#y = Math.max(-limitY, Math.min(limitY, this.#y));
    context.save();
    context.clearRect(0, 0, 512, 512);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, 512, 512);
    context.translate(256 + this.#x, 256 + this.#y);
    context.rotate((this.#angle * Math.PI) / 180);
    context.scale(scale, scale);
    context.drawImage(this.#image, -this.#image.naturalWidth / 2, -this.#image.naturalHeight / 2);
    context.restore();
    this.findAll<HTMLCanvasElement>('[data-preview]').forEach((preview) => {
      preview.getContext('2d')?.drawImage(canvas, 0, 0, preview.width, preview.height);
    });
    this.find('[data-scale]').textContent = `${Math.round(this.#zoom * 100)} %`;
  }

  destroy() {
    URL.revokeObjectURL(this.#url);
    super.destroy();
  }
}
