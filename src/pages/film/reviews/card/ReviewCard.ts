import './review-card.css';
import templateSource from './ReviewCard.hbs';
import { Component } from '../../../../core/component.js';
import { loadAssets } from '../../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class ReviewCard extends Component {
  static template = template;

  #revealed = false;
  #revealing = false;
  #expanded = false;
  #animating = false;

  context() {
    const { review } = this.props;
    return {
      review,
      expanded: this.#expanded,
      own: this.props.own,
      hidden: review.spoiler && !this.props.own && !this.#revealed,
    };
  }

  onRender() {
    this.delegate('click', '[data-expand]', () => this.#toggleText());
    const frame = requestAnimationFrame(() => {
      const text = this.find('[data-review-text]');
      const toggle = this.find<HTMLButtonElement>('[data-expand]');
      if (text && toggle) toggle.hidden = !this.#expanded && text.scrollHeight <= text.clientHeight + 1;
    });
    this.watch(() => cancelAnimationFrame(frame));
    this.delegate('click', '[data-reveal]', () => this.#revealSpoiler());
  }

  #revealSpoiler() {
    if (this.#revealing) return;
    const spoiler = this.find('.review-card__spoiler');
    if (!spoiler) return;
    this.#revealing = true;
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
    spoiler.style.setProperty('--spoiler-reveal-duration', `${duration}ms`);
    spoiler.classList.add('review-card__spoiler--revealing');
    const timer = window.setTimeout(() => {
      this.#revealed = true;
      this.#revealing = false;
      if (this.element?.contains(spoiler)) this.update();
    }, duration);
    this.watch(() => window.clearTimeout(timer));
  }

  async #toggleText() {
    if (this.#animating) return;
    const text = this.find('[data-review-text]');
    const toggle = this.find<HTMLButtonElement>('[data-expand]');
    if (!text) return;

    if (this.#expanded) this.element.scrollIntoView({ block: 'start', behavior: 'instant' });

    const start = text.getBoundingClientRect().height;
    if (this.#expanded) text.classList.add('review-card__text--collapsed');
    else text.classList.remove('review-card__text--collapsed');
    const end = text.getBoundingClientRect().height;
    text.classList.remove('review-card__text--collapsed');
    text.style.height = `${start}px`;
    text.style.overflow = 'hidden';

    this.#animating = true;
    if (toggle) {
      toggle.textContent = this.#expanded ? 'Развернуть' : 'Свернуть';
      toggle.setAttribute('aria-expanded', String(!this.#expanded));
      toggle.disabled = true;
    }
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 720;
    const animation = text.animate(
      [{ height: `${start}px` }, { height: `${end}px` }],
      { duration, easing: 'ease-in-out', fill: 'forwards' },
    );
    this.watch(() => animation.cancel());
    try {
      await animation.finished;
      if (this.element?.contains(text)) {
        const wasExpanded = this.#expanded;
        this.#expanded = !this.#expanded;
        this.update();
        if (wasExpanded) this.element.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    } catch {
      // The card was removed while the animation was running.
    } finally {
      this.#animating = false;
    }
  }
}
