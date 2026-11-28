import templateSource from './SpotlightSlide.hbs';
import { Component } from '../../../core/component.js';
import { MovieActions } from '../../../components/movie-actions/MovieActions.js';
import { loadAssets } from '../../../core/assets.js';
import { store, type OnlineConfState } from '../../../core/store.js';

const template = await loadAssets({ template: templateSource });

export class SpotlightSlide extends Component {
  static template = template;

  onRender() {
    this.insert('actions', new MovieActions({ film: this.props.film, variant: 'spotlight' }));
    const button = this.find('.spotlight__about');
    const applyTheme = ({ watchButtonTheme }: OnlineConfState) => {
      if (watchButtonTheme) {
        button.dataset.theme = watchButtonTheme;
      } else {
        delete button.dataset.theme;
      }
    };
    applyTheme(store.get('onlineconf'));
    this.watch(store.watch('onlineconf', applyTheme));
  }
}
