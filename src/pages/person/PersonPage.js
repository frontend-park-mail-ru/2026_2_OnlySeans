import './person-page.css';
import templateSource from './PersonPage.hbs';
import { Component } from '../../core/component.js';
import { getPerson } from '../../api/people.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { PersonProfile } from './profile/PersonProfile.js';
import { loadAssets } from '../../core/assets.js';
import { HttpStatus } from '../../api/errors.js';

const template = await loadAssets({ template: templateSource });

export class PersonPage extends Component {
  static template = template;

  #request = null;

  prepare() {
    this.#request = getPerson(this.props.params.id);
    return this.#request.catch(() => null);
  }

  onRender() {
    document.title = 'Персона | Frame';
    loadInto(this, 'content', {
      loading: 'Загружаем...',
      load: () => {
        const request = this.#request ?? getPerson(this.props.params.id);
        this.#request = null;
        return request;
      },
      render: (data) => {
        document.title = `${data.person.name} | Frame`;
        return new PersonProfile(data);
      },
      failure: (error) =>
        error.status === HttpStatus.NOT_FOUND
          ? { text: 'Такого человека нет в каталоге.', retry: false }
          : 'Не удалось загрузить страницу.',
    });
  }
}
