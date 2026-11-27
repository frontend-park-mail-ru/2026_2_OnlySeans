import templateSource from './UpcomingPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';

const template = await loadAssets({ template: templateSource });

/** Состояние недоступности расписания: API не возвращает даты премьер. */
export class UpcomingPage extends Component {
  static template = template;

  onRender() {
    document.title = 'Скоро в кино | Frame';
    this.insert(
      'state',
      new EmptyState({
        title: 'Расписание премьер пока недоступно',
        text: 'Загляните позже или выберите фильм в каталоге.',
      }),
    );
  }
}
