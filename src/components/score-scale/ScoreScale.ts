import './score-scale.css';
import templateSource from './ScoreScale.hbs';
import { Component } from '../../core/component.js';
import { SCORES, scoreWord } from '../../services/ratings.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const ARROW_STEPS = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
const MIN_SCORE = SCORES[0];
const MAX_SCORE = SCORES[SCORES.length - 1];

export class ScoreScale extends Component {
  static template = template;

  #value = 0;

  context() {
    return {
      labelledBy: this.props.labelledBy,
      scores: SCORES.map((score) => ({ score, word: scoreWord(score) })),
    };
  }

  onRender() {
    this.delegate('click', '.score-scale__score', (event, button) =>
      this.props.onSelect(Number(button.dataset.score)),
    );
    this.on('keydown', (event) => this.#onArrows(event));
    this.paint(this.props.value ?? 0, this.props.disabled);
  }

  paint(value, disabled = false) {
    this.#value = value;
    this.findAll<HTMLButtonElement>('.score-scale__score').forEach((button) => {
      const score = Number(button.dataset.score);
      button.classList.toggle('score-scale__score--filled', score <= value);
      button.setAttribute('aria-checked', String(score === value));
      button.tabIndex = score === value || (!value && score === MIN_SCORE) ? 0 : -1;
      button.disabled = disabled;
    });
  }

  focus(value = this.#value) {
    this.find(`[data-score="${value || MIN_SCORE}"]`)?.focus();
  }

  #onArrows(event) {
    const step = ARROW_STEPS[event.key];
    const targets = { Home: MIN_SCORE, End: MAX_SCORE };
    const next = step
      ? Math.min(MAX_SCORE, Math.max(MIN_SCORE, this.#value + step))
      : targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    this.props.onSelect(next);
  }
}
