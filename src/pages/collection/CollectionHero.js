import templateSource from './CollectionHero.hbs';
import { Component } from '../../core/component.js';
import { Button } from '../../components/button/Button.js';
import { PosterStack } from '../../components/poster-stack/PosterStack.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class CollectionHero extends Component {
  static template = template;

  onRender() {
    this.insert(
      'back',
      new Button({
        text: 'Все подборки',
        href: '/collections',
        variant: 'secondary',
        iconBefore: 'arrow-left',
      }),
    );
    this.insert('posters', new PosterStack({ films: this.props.films, size: 'large' }));
  }
}
