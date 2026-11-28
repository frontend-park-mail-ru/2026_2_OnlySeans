import templateSource from './SpotlightSlide.hbs';
import { Component } from '../../../core/component.js';
import { MovieActions } from '../../../components/movie-actions/MovieActions.js';
import { loadAssets } from '../../../core/assets.js';
import { store } from '../../../core/store.js';
import type { OnlineConfRuntime } from '../../../services/onlineconf-runtime.js';

const template = await loadAssets({ template: templateSource });

export class SpotlightSlide extends Component {
  static template = template;

  onRender() {
    this.insert('actions', new MovieActions({ film: this.props.film, variant: 'spotlight' }));
    const button = this.find('.spotlight__about');
    const applyTheme = (runtime: OnlineConfRuntime | null | undefined) => {
      const theme = runtime?.configs['frontend.watch_button_theme'];
      if (runtime?.flags['frontend.watch_button_theme_enabled'] === true && (theme === 'amber' || theme === 'wine')) {
        button.dataset.theme = theme;
      } else {
        delete button.dataset.theme;
      }
    };
    applyTheme(store.get('onlineConf'));
    this.watch(store.watch('onlineConf', applyTheme));
  }
}
