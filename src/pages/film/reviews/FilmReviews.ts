import './film-reviews.css';
import templateSource from './FilmReviews.hbs';
import { Component } from '../../../core/component.js';
import { store } from '../../../core/store.js';
import { getReviewsPage } from '../../../api/reviews.js';
import { loadInto } from '../../../components/status-message/load-into.js';
import { loginPathHere } from '../../../services/auth-return.js';
import { MyReview } from './mine/MyReview.js';
import { ReviewList } from './ReviewList.js';
import { loadAssets } from '../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class FilmReviews extends Component {
  static template = template;

  context() {
    return { user: store.get('user'), loginHref: loginPathHere() };
  }

  onRender() {
    const { film } = this.props;
    if (store.get('user')) this.insert('mine', new MyReview({ film }));
    loadInto(this, 'list', {
      loading: 'Загружаем отзывы...',
      load: () => getReviewsPage(film.id),
      render: (page) => new ReviewList({ film, page }),
      failure: () => 'Не удалось загрузить отзывы.',
    });
    this.watch(store.watch('user', () => this.update()));
  }
}
