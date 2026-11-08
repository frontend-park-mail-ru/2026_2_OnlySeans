import './spotlight.css';
import templateSource from './Spotlight.hbs';
import { Component } from '../../../core/component.js';
import { buildSlides } from './spotlight-slides.js';
import { SpotlightSlide } from './SpotlightSlide.js';
import { loadAssets } from '../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const INTERVAL = 8000;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Spotlight extends Component {
  static template = template;

  #current = 0;
  #slide = null;
  #timer = null;
  #progress = null;
  #remaining = INTERVAL;
  #startedAt = 0;
  #holds = new Set();

  context() {
    this.slides = buildSlides(this.props.films);
    return { slides: this.slides };
  }

  onRender() {
    this.#slide = null;
    this.#show(0, false);
    this.delegate('click', '[data-index]', (event, button) =>
      this.#show(Number(button.dataset.index)),
    );
    this.on('pointerenter', (event) => event.pointerType === 'mouse' && this.#hold('hover'));
    this.on('pointerleave', () => this.#release('hover'));
    this.on('focusin', (event) => event.target.matches(':focus-visible') && this.#hold('focus'));
    this.on(
      'focusout',
      (event) => !this.element.contains(event.relatedTarget) && this.#release('focus'),
    );
    const onVisibility = () => (document.hidden ? this.#hold('hidden') : this.#release('hidden'));
    this.on('visibilitychange', onVisibility, document);
    this.watch(() => {
      clearTimeout(this.#timer);
      this.#progress?.cancel();
    });
  }

  #show(index, animate = true) {
    this.#current = (index + this.slides.length) % this.slides.length;
    const { label, film } = this.slides[this.#current];
    const slide = new SpotlightSlide({ label, film });
    this.#slide = this.#slide ? this.swap(this.#slide, slide) : this.insert('slide', slide);
    this.#updateRubrics();
    this.#updateAtmosphere(film.poster);
    if (animate && !reducedMotion()) this.#animateIn();
    this.#schedule();
  }

  #updateRubrics() {
    const strip = this.find('.spotlight__rubrics');
    this.findAll('[data-index]').forEach((button, index) => {
      const active = index === this.#current;
      button.setAttribute('aria-pressed', String(active));
      if (!active) return;
      const left = button.offsetLeft - strip.offsetLeft;
      if (
        left < strip.scrollLeft ||
        left + button.offsetWidth > strip.scrollLeft + strip.clientWidth
      )
        strip.scrollTo({
          left: left - (strip.clientWidth - button.offsetWidth) / 2,
          behavior: 'smooth',
        });
    });
  }

  #updateAtmosphere(poster) {
    const atmosphere = this.find('.spotlight__atmosphere');
    if (!poster) return;
    const image = new Image();
    image.className = 'spotlight__backdrop';
    image.alt = '';
    image.onload = () => {
      const old = [...atmosphere.children];
      atmosphere.append(image);
      if (reducedMotion()) {
        old.forEach((node) => node.remove());
        return;
      }
      image.animate(
        [
          { opacity: 0, transform: 'scale(1.06)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        {
          duration: 1600,
          easing: 'ease-out',
        },
      );
      old.forEach((node) =>
        node
          .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1300 })
          .finished.finally(() => node.remove()),
      );
    };
    image.src = poster;
  }

  #animateIn() {
    [this.find('.spotlight__poster'), this.find('.spotlight__text')].forEach((node, index) =>
      node.animate(
        [
          { opacity: 0, translate: '0 6px' },
          { opacity: 1, translate: '0 0' },
        ],
        {
          duration: 750,
          delay: index * 120,
          fill: 'backwards',
          easing: 'cubic-bezier(.2,.7,.2,1)',
        },
      ),
    );
  }

  #schedule() {
    clearTimeout(this.#timer);
    this.#progress?.cancel();
    this.#remaining = INTERVAL;
    const bar = this.findAll('.spotlight__progress')[this.#current];
    this.#progress = reducedMotion()
      ? null
      : bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
          duration: INTERVAL,
          fill: 'forwards',
        });
    if (this.#holds.size) this.#progress?.pause();
    else this.#run();
  }

  #run() {
    this.#startedAt = performance.now();
    this.#timer = setTimeout(() => this.#show(this.#current + 1), this.#remaining);
  }

  #hold(reason) {
    if (!this.#holds.size) {
      clearTimeout(this.#timer);
      this.#remaining = Math.max(0, this.#remaining - (performance.now() - this.#startedAt));
      this.#progress?.pause();
    }
    this.#holds.add(reason);
    this.element.classList.add('is-paused');
  }

  #release(reason) {
    if (!this.#holds.delete(reason) || this.#holds.size) return;
    this.element.classList.remove('is-paused');
    this.#progress?.play();
    this.#run();
  }
}
