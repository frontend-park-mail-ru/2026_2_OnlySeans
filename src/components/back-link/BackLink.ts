import './back-link.css';
import templateSource from './BackLink.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class BackLink extends Component {
  static template = template;
}
