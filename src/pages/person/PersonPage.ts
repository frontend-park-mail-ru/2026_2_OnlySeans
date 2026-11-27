import { ApiError } from '../../api/http.js';
import './person-page.css';
import templateSource from './PersonPage.hbs';
import { Component } from '../../core/component.js';
import { getPerson } from '../../api/people.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { PersonProfile } from './profile/PersonProfile.js';
import { loadAssets } from '../../core/assets.js';
import { HttpStatus } from '../../api/errors.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';
import { Skeleton } from '../../components/skeleton/Skeleton.js';

const template = await loadAssets({ template: templateSource });

export class PersonPage extends Component {
  static template = template;

  onRender() {
    const controller = new AbortController();
    this.watch(() => controller.abort());
    document.title = 'Персона | Frame';
    loadInto(this, 'content', {
      loading: 'Загружаем...',
      loadingView: () => new Skeleton({ variant: 'person' }),
      load: () => getPerson(this.props.params.id, { signal: controller.signal }),
      render: (data) => {
        document.title = `${data.person.name} | Frame`;
        if (typeof this.props.restoreScroll === 'number') {
          let frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => {
              if (this.element?.isConnected) window.scrollTo(0, this.props.restoreScroll);
            });
          });
          this.watch(() => cancelAnimationFrame(frame));
        }
        return new PersonProfile({
          ...data,
          query: this.props.query,
          onRetry: () => this.update(),
        });
      },
      failureView: (error, retry) =>
        new EmptyState({
          requestError: !(error instanceof ApiError && error.status === HttpStatus.NOT_FOUND),
          code:
            error instanceof ApiError && error.status !== HttpStatus.NOT_FOUND ? error.status : '',
          button: 'Повторить',
          variant:
            error instanceof ApiError && error.status === HttpStatus.NOT_FOUND ? 'person' : 'error',
          title:
            error instanceof ApiError && error.status === HttpStatus.NOT_FOUND
              ? 'Такого человека нет в каталоге'
              : 'Не удалось загрузить страницу человека',
          text:
            error instanceof ApiError && error.status === HttpStatus.NOT_FOUND
              ? 'Возможно, ссылка устарела. Найдите актёра или режиссёра через поиск.'
              : error instanceof Error && error.message === 'offline cache miss'
                ? 'Эта страница ещё не загружалась. Подключитесь к сети и повторите.'
                : 'Попробуйте ещё раз через некоторое время.',
          onRetry:
            error instanceof ApiError && error.status === HttpStatus.NOT_FOUND ? undefined : retry,
          href: '/search',
          linkText: 'Найти человека',
          homeLink: error instanceof ApiError && error.status === HttpStatus.NOT_FOUND,
        }),
    });
  }
}
