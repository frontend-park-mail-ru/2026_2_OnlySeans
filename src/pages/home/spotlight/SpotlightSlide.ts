import templateSource from './SpotlightSlide.hbs';
import { Component } from '../../../core/component.js';
import { MovieActions } from '../../../components/movie-actions/MovieActions.js';
import { loadAssets } from '../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class SpotlightSlide extends Component {
  static template = template;

  onRender() {
    this.insert('actions', new MovieActions({ film: this.props.film, variant: 'spotlight' }));
  }
}
