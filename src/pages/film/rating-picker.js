import { element } from '../../utils/dom.js';
import { RATING_FIELDS } from '../../services/axis-ratings.js';

export const scoreWord = (value) => {
  if (value >= 9) return 'шедевр';
  if (value >= 7) return 'отлично';
  if (value >= 5) return 'неплохо';
  if (value >= 3) return 'слабо';
  return 'плохо';
};
const validScore = (value) => Number.isInteger(value) && value >= 1 && value <= 10;

/** Приводит оценку из API/черновика к виду { overall, plot, visual, acting, music, rewatch } или null. */
export const normalizeRatings = (value) => {
  if (!value || typeof value !== 'object') return null;
  const result = { rewatch: value.rewatch === true };
  for (const { key } of RATING_FIELDS) if (validScore(value[key])) result[key] = value[key];
  return RATING_FIELDS.some(({ key }) => result[key]) ? result : null;
};

/** Мини-сводка оценки отзыва: построчные оценки по осям. */
export const createReviewScore = (ratings) => {
  const clean = normalizeRatings(ratings);
  if (!clean) return null;
  const box = element('div', 'review-score');
  if (clean.overall) {
    const overall = element('div', 'review-score__overall');
    overall.append(
      element('strong', '', String(clean.overall)),
      element('span', '', `из 10 · ${scoreWord(clean.overall)}`),
    );
    overall.setAttribute('aria-label', `Общая оценка: ${clean.overall} из 10`);
    box.append(overall);
  }
  const axes = element('ul', 'review-score__axes');
  for (const { key, label } of RATING_FIELDS) {
    if (key === 'overall' && clean.overall) continue;
    const item = element(
      'li',
      `review-score__axis review-score__axis--${key}${clean[key] ? '' : ' is-empty'}`,
    );
    item.append(
      element('span', '', label),
      element('strong', '', clean[key] ? String(clean[key]) : '—'),
    );
    axes.append(item);
  }
  // Если по осям ничего не поставлено (только общая оценка), строки с прочерками не показываем.
  const side = element('div', 'review-score__side');
  if (RATING_FIELDS.some(({ key }) => key !== 'overall' && clean[key]) || !clean.overall)
    side.append(axes);
  if (clean.rewatch) side.append(element('span', 'review-score__rewatch', '↻ пересмотрел бы'));
  box.append(side);
  return box;
};

/** Выбор оценки по осям для формы отзыва: построчные шкалы + «пересмотрел бы». */
export const createRatingPicker = ({ initial = null, onChange = () => {} } = {}) => {
  let state = {
    overall: null,
    plot: null,
    visual: null,
    acting: null,
    music: null,
    rewatch: false,
    ...(normalizeRatings(initial) || {}),
  };
  const root = element('fieldset', 'rating-picker');
  const legend = element('legend', 'rating-picker__legend');
  legend.append(
    element('span', '', 'Ваша оценка'),
    element('span', 'rating-picker__hint', 'необязательно'),
  );
  const progress = element('span', 'rating-picker__progress');
  progress.setAttribute('aria-live', 'polite');
  const reset = element('button', 'rating-picker__reset', 'Сбросить');
  reset.type = 'button';
  const head = element('div', 'rating-picker__head');
  head.append(progress, reset);
  // Общая оценка — главная: отдельный крупный блок сверху; оси — второстепенные детали под ним.
  const primary = element('div', 'rating-picker__primary');
  const rows = element('div', 'axis-rating__rows');
  const detailsLabel = element('p', 'rating-picker__details-label', 'По деталям');
  const rewatch = element('button', 'axis-rewatch');
  rewatch.type = 'button';
  const controls = element('div', 'rating-picker__controls');
  controls.append(primary, detailsLabel, rows, rewatch);
  const body = element('div', 'rating-picker__body');
  body.append(controls);
  root.append(legend, head, body);

  for (const { key, label } of RATING_FIELDS) {
    const row = element('div', `axis-row axis-row--${key}`);
    row.dataset.axis = key;
    const name = element('span', 'axis-row__label', label);
    name.id = `${Math.random().toString(36).slice(2)}-${key}`;
    const scale = element('div', 'axis-row__scale');
    scale.setAttribute('role', 'radiogroup');
    scale.setAttribute('aria-labelledby', name.id);
    for (let score = 1; score <= 10; score++) {
      const button = element('button', 'axis-score');
      button.type = 'button';
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-label', `${label}: ${score} из 10 — ${scoreWord(score)}`);
      button.title = `${score} — ${scoreWord(score)}`;
      button.dataset.score = String(score);
      button.textContent = String(score);
      button.addEventListener('click', () =>
        set({ ...state, [key]: state[key] === score ? null : score }),
      );
      scale.append(button);
    }
    scale.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
      if (!step && !['Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = state[key] || Number(event.target.closest('.axis-score')?.dataset.score) || 0;
      let next = Math.min(10, Math.max(1, current + step));
      if (event.key === 'Home') next = 1;
      if (event.key === 'End') next = 10;
      set({ ...state, [key]: next });
      scale.querySelector(`[data-score="${next}"]`)?.focus();
    });
    row.append(name, scale, element('span', 'axis-row__value'));
    (key === 'overall' ? primary : rows).append(row);
  }
  rewatch.addEventListener('click', () => set({ ...state, rewatch: !state.rewatch }));
  reset.addEventListener('click', () => {
    set({ overall: null, plot: null, visual: null, acting: null, music: null, rewatch: false });
    primary.querySelector('.axis-score')?.focus();
  });

  const render = () => {
    const rated = RATING_FIELDS.filter(({ key }) => state[key]).length;
    progress.textContent = rated
      ? `Оценено ${rated} из ${RATING_FIELDS.length}`
      : 'Выберите оценку от 1 до 10 в каждой строке';
    for (const row of controls.querySelectorAll('.axis-row')) {
      const value = state[row.dataset.axis];
      row.querySelector('.axis-row__value').textContent = value
        ? `${value} · ${scoreWord(value)}`
        : '—';
      [...row.querySelectorAll('.axis-score')].forEach((button, index) => {
        const score = index + 1;
        button.setAttribute('aria-checked', String(score === value));
        button.classList.toggle('is-filled', Boolean(value) && score <= value);
        button.tabIndex = (value ? score === value : score === 1) ? 0 : -1;
      });
    }
    rewatch.setAttribute('aria-pressed', String(state.rewatch));
    rewatch.replaceChildren(
      element('span', 'axis-rewatch__track'),
      element('span', '', 'Пересмотрел бы'),
    );
    rewatch.disabled = !rated;
    rewatch.title = rated ? '' : 'Сначала поставьте хотя бы одну оценку';
    reset.style.visibility = rated || state.rewatch ? 'visible' : 'hidden';
    reset.tabIndex = rated || state.rewatch ? 0 : -1;
  };
  const set = (next) => {
    state = {
      overall: null,
      plot: null,
      visual: null,
      acting: null,
      music: null,
      rewatch: false,
      ...next,
    };
    render();
    onChange(normalizeRatings(state));
  };
  render();
  return {
    element: root,
    value: () => normalizeRatings(state),
    set: (value) => {
      state = {
        overall: null,
        plot: null,
        visual: null,
        acting: null,
        music: null,
        rewatch: false,
        ...(normalizeRatings(value) || {}),
      };
      render();
    },
    setDisabled: (disabled) => (root.disabled = disabled),
  };
};
