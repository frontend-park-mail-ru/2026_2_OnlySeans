import { BaseComponent } from '../base-component.js';
import { createMovieCard } from '../movie-card/movie-card.js';
import { createButton } from '../button/button.js';
import { createMoreCard } from '../more-card/more-card.js';
import { createAuthGate } from '../auth-gate/auth-gate.js';

const template = window.Handlebars.compile(`
  <section class="movie-collection" id="{{id}}" aria-labelledby="{{id}}-title">
    <div class="movie-collection__heading">
      <div><p class="movie-collection__eyebrow">{{eyebrow}}</p><h2 id="{{id}}-title">{{title}}</h2><p class="movie-collection__subtitle">{{subtitle}}</p></div>
      <span class="movie-collection__count" aria-live="polite"></span>
    </div>
    <div class="movie-collection__content"></div>
  </section>
`);

export class MovieCollection extends BaseComponent {
  constructor(props) { super(template, props); this.href = props.href; }

  update(movies, emptyMessage, { href = this.href, locked = false } = {}) {
    this.observer?.disconnect();
    const element = this.create();
    element.querySelector('.movie-collection__count').textContent = 'Найдено: ' + movies.length;
    const content = element.querySelector('.movie-collection__content');
    content.replaceChildren();
    if (locked) {
      element.querySelector('.movie-collection__count').textContent = '';
      content.appendChild(createAuthGate());
      return;
    }
    if (!movies.length) {
      const empty = document.createElement('p');
      empty.className = 'movie-collection__empty';
      empty.textContent = emptyMessage;
      content.appendChild(empty);
    }
    {
      const visible = movies.slice(0, 10);
      const viewport = document.createElement('div');
      viewport.className = 'movie-collection__carousel';
      viewport.id = this.props.id + '-carousel';
      viewport.tabIndex = 0;
      viewport.setAttribute('role', 'group');
      viewport.setAttribute('aria-label', this.props.title + ': листайте стрелками влево и вправо');
      visible.forEach((movie) => viewport.appendChild(createMovieCard(movie)));
      viewport.appendChild(createMoreCard({ href, title: this.props.title }));
      const totalCards = visible.length + 1;
      content.appendChild(viewport);
      const navigation = document.createElement('div');
      navigation.className = 'movie-collection__navigation';
      const previous = createButton({ text: '←' });
      const next = createButton({ text: '→' });
      [previous, next].forEach((button) => { button.className = 'movie-collection__arrow'; button.setAttribute('aria-controls', viewport.id); });
      previous.setAttribute('aria-label', 'Предыдущие карточки: ' + this.props.title);
      next.setAttribute('aria-label', 'Следующие карточки: ' + this.props.title);
      const position = document.createElement('span');
      position.className = 'movie-collection__position';
      position.setAttribute('aria-live', 'polite');
      const updateNavigation = () => {
        previous.disabled = viewport.scrollLeft <= 1;
        next.disabled = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 2;
        const bounds = viewport.getBoundingClientRect();
        const shown = [...viewport.children].map((card, index) => ({ bounds: card.getBoundingClientRect(), index }))
          .filter((card) => card.bounds.right > bounds.left + 9 && card.bounds.left < bounds.left + viewport.clientWidth - 9);
        const first = shown.length ? shown[0].index + 1 : 1;
        const last = shown.length ? shown[shown.length - 1].index + 1 : 1;
        position.textContent = first + '–' + last + ' / ' + totalCards;
      };
      const scroll = (direction) => viewport.scrollBy({ left: direction * viewport.clientWidth,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      previous.addEventListener('click', () => scroll(-1));
      next.addEventListener('click', () => scroll(1));
      viewport.addEventListener('scroll', updateNavigation, { passive: true });
      viewport.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        scroll(event.key === 'ArrowLeft' ? -1 : 1);
      });
      navigation.append(previous, position, next);
      content.appendChild(navigation);
      this.observer = new ResizeObserver(updateNavigation);
      this.observer.observe(viewport);
    }
  }
  remove() { this.observer?.disconnect(); super.remove(); }
}
