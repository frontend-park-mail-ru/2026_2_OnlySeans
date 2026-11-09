import './review-list.css';
import templateSource from './ReviewList.hbs';
import { Component } from '../../../core/component.js';
import { store } from '../../../core/store.js';
import { getReviewsPage } from '../../../api/reviews.js';
import { errorMessage } from '../../../api/errors.js';
import { notify } from '../../../services/notice.js';
import { myReview } from '../../../services/my-review.js';
import { ReviewCard } from './card/ReviewCard.js';
import { loadAssets } from '../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class ReviewList extends Component {
  static template = template;

  #cards = [];
  #nextOffset = 0;
  #hasMore = false;
  #busy = false;

  constructor(props) {
    super(props);
    this.#add(props.page);
  }

  context() {
    return {
      empty: !this.#cards.length && !this.#hasMore,
      onlyMine: Boolean(myReview(this.props.film.id)),
      hasMore: this.#hasMore,
      busy: this.#busy,
    };
  }

  onRender() {
    const items = this.find('[data-items]');
    this.#cards.forEach((card) => {
      const item = document.createElement('li');
      items.append(item);
      this.insert(item, card);
    });
    this.delegate('click', '[data-more]', () => this.#more());
  }

  #add({ reviews, nextOffset, hasMore }) {
    const me = store.get('user')?.id;
    const known = new Set(this.#cards.map((card) => card.props.review.id));
    reviews
      .filter((review) => review.author.id !== me && !known.has(review.id))
      .forEach((review) => this.#cards.push(new ReviewCard({ review })));
    this.#nextOffset = nextOffset;
    this.#hasMore = hasMore;
  }

  async #more() {
    if (this.#busy) return;
    this.#busy = true;
    this.update();
    try {
      this.#add(await getReviewsPage(this.props.film.id, this.#nextOffset));
    } catch (error) {
      notify(errorMessage(error), { type: 'error' });
    } finally {
      this.#busy = false;
      if (this.element) this.update();
    }
  }
}
