import './search-field.css';
import templateSource from './SearchField.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { rememberSearch } from '../../services/search-history.js';

const template = await loadAssets({ template: templateSource });

/** Поиск в каталоге с сохранением запроса в адресной строке. */
export class SearchField extends Component {
  static template = template;

  context() {
    return { query: new URLSearchParams(location.search).get('q') || '' };
  }

  onRender() {
    this.on('submit', (event) => {
      event.preventDefault();
      const query = this.find<HTMLInputElement>('input').value.trim();
      rememberSearch(query);
      this.props.navigate(`/search${query ? `?${new URLSearchParams({ q: query })}` : ''}`);
    });
  }

  focus() {
    this.find<HTMLInputElement>('input').focus();
  }

  syncRoute() {
    this.find<HTMLInputElement>('input').value =
      new URLSearchParams(location.search).get('q') || '';
  }
}
