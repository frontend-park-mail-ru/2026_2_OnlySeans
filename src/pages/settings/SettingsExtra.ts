import templateSource from './SettingsExtra.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

/** Разделы показывают недоступные возможности без имитации сохранённых предпочтений. */
export class SettingsExtra extends Component<{ section: string }> {
  static template = template;
  context() {
    return {
      notifications: this.props.section === 'notifications',
      map: this.props.section === 'map',
      events: [
        { name: 'Премьеры', text: 'Из «Скоро в кино»' },
        { name: 'Новые роли', text: 'Люди, на которых вы подписаны' },
        { name: 'Ответы на отзывы', text: 'Комментарии к вашим отзывам' },
        { name: 'Подборки и места съёмок', text: 'Новое о любимых фильмах' },
        { name: 'Новости Frame', text: 'Новости сервиса' },
      ].map((event) => ({
        ...event,
        channels: ['Сайт', 'Почта', 'Push'].map((channel) => ({
          label: `${event.name}: ${channel}`,
        })),
      })),
    };
  }
}
