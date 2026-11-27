import './genres-page.css';
import templateSource from './GenresPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { loadCatalog } from '../../services/catalog.js';
import { countLabel } from '../../core/format.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';
import { GenreCatalog } from './GenreCatalog.js';
import type { PageProps } from '../../app/router.js';
import { Skeleton } from '../../components/skeleton/Skeleton.js';
import { visibleContent } from '../../services/content-preferences.js';

interface GenresProps extends PageProps {
  loaded?: boolean;
  total?: number;
  genres?: { name: string; count: string; poster?: string; href: string }[];
}

const template = await loadAssets({ template: templateSource });

/** Каталог жанров; количество и изображения получаются из фильмов API. */
export class GenresPage extends Component<GenresProps> {
  static template = template;

  onRender() {
    if (this.props.query.get('genre')?.trim()) {
      this.insert('detail', new GenreCatalog(this.props));
      return;
    }
    document.title = 'Жанры | Frame';
    this.insert('heading', new SectionHeading({ title: 'Жанры', level: 1 }));
    if (this.props.loaded) {
      if (!this.props.genres?.length)
        this.insert(
          this.find('.genres-page__grid'),
          new EmptyState({
            title: 'Жанров пока нет',
            text: 'Добавленные в каталог фильмы появятся здесь.',
          }),
        );
      return;
    }
    const controller = new AbortController();
    this.watch(() => controller.abort());
    let fresh = false;
    loadInto(this, 'genres', {
      loadingView: () => new Skeleton({ variant: 'catalog' }),
      load: () => {
        const request = loadCatalog({ signal: controller.signal, fresh });
        fresh = true;
        return request;
      },
      failureView: (_, retry) =>
        new EmptyState({
          requestError: true,
          title: 'Не удалось загрузить жанры',
          text: 'Проверьте соединение и повторите попытку.',
          button: 'Повторить',
          onRetry: retry,
        }),
      render: (catalog) => {
        const films = visibleContent(catalog);
        const genres = new Map<string, typeof films>();
        films.forEach((film) =>
          film.genres.forEach((name) => {
            if (!genres.has(name)) genres.set(name, []);
            genres.get(name)?.push(film);
          }),
        );
        this.update({
          loaded: true,
          total: films.length,
          genres: [...genres].map(([name, items]) => ({
            name,
            count: countLabel(items.length, ['фильм', 'фильма', 'фильмов']),
            poster: items.find((film) => film.poster)?.poster,
            href: `/genres?${new URLSearchParams({ genre: name })}`,
          })),
        });
        return null;
      },
    });
  }

  context() {
    return { ...this.props, selected: Boolean(this.props.query.get('genre')?.trim()) };
  }
}
