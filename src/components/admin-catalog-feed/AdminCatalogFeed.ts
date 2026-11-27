import templateSource from './AdminCatalogFeed.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import type { Film } from '../../api/films.js';

const template = await loadAssets({ template: templateSource });
interface FeedProps {
  films: Film[];
  total: number;
  received: number;
  loading: boolean;
  error: string;
  complete: boolean;
  filtered: boolean;
  onMore: () => void;
  onDelete: (id: number) => void;
}

/** Общая разметка строк превращается в карточки на узком экране. */
export class AdminCatalogFeed extends Component<FeedProps> {
  static template = template;

  context() {
    return {
      ...this.props,
      messageRole: this.props.error ? 'alert' : 'status',
      empty: !this.props.films.length && !this.props.loading && !this.props.error,
      skeleton: this.props.loading && !this.props.received ? Array.from({ length: 6 }) : [],
      canMore: !this.props.complete && !this.props.loading,
      message: this.props.loading
        ? 'Загружаем фильмы…'
        : this.props.error ||
          (this.props.complete
            ? 'Вы просмотрели весь список'
            : 'Прокрутите вниз, чтобы загрузить ещё'),
    };
  }

  onRender() {
    this.delegate('click', '[data-more]', () => this.props.onMore());
    this.delegate('click', '[data-delete-id]', (_, button) =>
      this.props.onDelete(Number(button.dataset.deleteId)),
    );
    if (!this.props.complete && !this.props.loading && !this.props.error) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) this.props.onMore();
        },
        { rootMargin: '300px' },
      );
      observer.observe(this.find('[data-sentinel]'));
      this.watch(() => observer.disconnect());
    }
  }
}
