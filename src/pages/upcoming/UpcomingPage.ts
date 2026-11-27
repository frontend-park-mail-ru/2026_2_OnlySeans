import templateSource from './UpcomingPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';
import './upcoming-page.css';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { calendarMonth } from '../../services/release-calendar.js';
import type { PageProps } from '../../app/router.js';

const template = await loadAssets({ template: templateSource });

/** Состояние недоступности расписания: API не возвращает даты премьер. */
export class UpcomingPage extends Component<PageProps> {
  static template = template;

  context() {
    const month = calendarMonth(this.props.query.get('month'));
    const list = this.props.query.get('view') === 'list';
    const region = this.props.query.get('region') === 'russia' ? 'russia' : 'world';
    const href = (key: string, view = list ? 'list' : 'calendar', releaseRegion = region) =>
      `/upcoming?${new URLSearchParams({ month: key, view, region: releaseRegion })}`;
    return {
      ...month,
      list,
      regionLabel: region === 'russia' ? 'в России' : 'в мире',
      regions: [
        {
          label: 'В мире',
          href: href(month.key, undefined, 'world'),
          current: region === 'world' ? 'page' : 'false',
        },
        {
          label: 'В России',
          href: href(month.key, undefined, 'russia'),
          current: region === 'russia' ? 'page' : 'false',
        },
      ],
      previousHref: href(month.previous),
      nextHref: href(month.next),
      previous: month.key > '1900-01',
      next: month.key < '2099-12',
      views: [
        { label: 'Календарь', href: href(month.key, 'calendar'), current: list ? 'false' : 'page' },
        { label: 'Список', href: href(month.key, 'list'), current: list ? 'page' : 'false' },
      ],
      weekdays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    };
  }

  onRender() {
    document.title = 'Скоро в кино | Frame';
    this.insert('heading', new SectionHeading({ title: 'Календарь релизов', level: 1 }));
    const input = this.find<HTMLInputElement>('[name=month]');
    input.value = calendarMonth(this.props.query.get('month')).key;
    this.on(
      'change',
      () => {
        const valid = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(input.value);
        this.find('[data-month-error]').textContent = valid
          ? ''
          : 'Выберите месяц с января 1900 по декабрь 2099';
        input.setAttribute('aria-invalid', String(!valid));
        if (valid)
          this.props.navigate(
            `/upcoming?${new URLSearchParams({ month: input.value, view: this.props.query.get('view') === 'list' ? 'list' : 'calendar', region: this.props.query.get('region') === 'russia' ? 'russia' : 'world' })}`,
          );
      },
      input,
    );
    this.insert(
      'state',
      new EmptyState({
        variant: 'upcoming',
        level: 2,
        title: `Даты выхода ${this.context().regionLabel} пока недоступны`,
        text: 'Загляните позже или выберите фильм в каталоге.',
        href: '/films',
        linkText: 'Перейти к фильмам',
      }),
    );
  }
}
