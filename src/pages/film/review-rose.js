import { RATING_AXES } from '../../services/axis-ratings.js';

// «Роза» оценки в виде розы ветров: четыре луча-оси, длина луча = оценка (1–10).
// Сюжет — вверху, визуал — справа, актёры — внизу, музыка — слева.
// Между соседними оценёнными осями — короткие промежуточные лучи, как у розы ветров.

const NS = 'http://www.w3.org/2000/svg';
const RADIUS = 100;
const TWEEN_MS = 260;
export const AXIS_ANGLES = { plot: 0, visual: 90, acting: 180, music: 270 };
const svg = (tag, attributes = {}) => { const node = document.createElementNS(NS, tag);for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));return node; };
const polar = (angle, radius) => { const rad = angle * Math.PI / 180;return [Math.sin(rad) * radius, -Math.cos(rad) * radius]; };
const point = ([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`;
const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Две половины луча (светлая и тёмная грань), как у стрелки розы ветров. */
export const rayHalves = (angle, length, width = Math.min(17, Math.max(4, length * .42))) => {
  const tip = polar(angle, length), left = polar(angle - 45, width), right = polar(angle + 45, width);
  return [`0,0 ${point(left)} ${point(tip)}`, `0,0 ${point(tip)} ${point(right)}`];
};

/** Роза оценки с подписями осей и значениями; size — ширина в px. */
export const createReviewRose = ({ size = 280 } = {}) => {
  const pad = 150;
  const root = svg('svg', { viewBox: `${-pad} ${-pad} ${pad * 2} ${pad * 2}`, width: size, height: size, class: 'review-rose', role: 'img' });
  const title = svg('title');root.append(title);

  const grid = svg('g', { class: 'review-rose__grid' });
  for (let ring = 2; ring <= 10; ring += 2) {
    grid.append(svg('circle', { r: ring * RADIUS / 10, class: `review-rose__ring${ring === 10 ? ' review-rose__ring--outer' : ''}` }));
    if (ring < 10) {
      const [x, y] = polar(45, ring * RADIUS / 10);
      const tick = svg('text', { x: x + 2, y: y - 2, class: 'review-rose__tick' });tick.textContent = String(ring);grid.append(tick);
    }
  }
  for (const angle of [0, 45, 90, 135]) {
    const [x1, y1] = polar(angle, RADIUS + 6), [x2, y2] = polar(angle + 180, RADIUS + 6);
    grid.append(svg('line', { x1, y1, x2, y2, class: `review-rose__guide${angle % 90 ? ' review-rose__guide--minor' : ''}` }));
  }
  for (const { key } of RATING_AXES) for (const half of rayHalves(AXIS_ANGLES[key], RADIUS)) grid.append(svg('polygon', { points: half, class: 'review-rose__slot' }));
  root.append(grid);

  const minor = svg('g', { class: 'review-rose__minor' });
  const rays = svg('g', { class: 'review-rose__rays' });
  const center = svg('g', { class: 'review-rose__center' });
  const centerText = svg('text', { y: 1, 'dominant-baseline': 'middle', 'text-anchor': 'middle' });
  center.append(svg('circle', { r: 21 }), centerText);
  const rayNodes = {};
  for (const { key } of RATING_AXES) {
    const light = svg('polygon', { class: 'review-rose__ray review-rose__ray--light', 'data-axis': key });
    const dark = svg('polygon', { class: 'review-rose__ray review-rose__ray--dark', 'data-axis': key });
    rays.append(light, dark);rayNodes[key] = [light, dark];
  }
  root.append(minor, rays, center);

  const labelNodes = {};
  const group = svg('g', { class: 'review-rose__labels' });
  for (const { key, label } of RATING_AXES) {
    const angle = AXIS_ANGLES[key], [x, y] = polar(angle, RADIUS + 26);
    const anchor = angle === 90 ? 'start' : angle === 270 ? 'end' : 'middle';
    const lx = angle === 90 ? x - 12 : angle === 270 ? x + 12 : x, ly = angle === 0 ? y - 6 : angle === 180 ? y + 6 : y - 7;
    const text = svg('text', { x: lx, y: ly, 'text-anchor': anchor, class: `review-rose__label review-rose__label--${key}` });
    const name = svg('tspan', { class: 'review-rose__label-name' });name.textContent = label;
    const value = svg('tspan', { x: lx, dy: 18, class: 'review-rose__label-value' });
    text.append(name, value);group.append(text);labelNodes[key] = value;
  }
  root.append(group);

  let shown = Object.fromEntries(RATING_AXES.map(({ key }) => [key, 0]));
  let frame = 0;
  const draw = values => {
    for (const { key } of RATING_AXES) {
      const length = values[key] * RADIUS / 10;
      const [light, dark] = rayNodes[key];
      if (length <= .5) { light.setAttribute('points', '');dark.setAttribute('points', '');continue; }
      const [a, b] = rayHalves(AXIS_ANGLES[key], length);light.setAttribute('points', a);dark.setAttribute('points', b);
    }
    minor.replaceChildren();
    RATING_AXES.forEach(({ key }, index) => {
      const next = RATING_AXES[(index + 1) % RATING_AXES.length].key;
      if (values[key] < .5 || values[next] < .5) return;
      const length = (values[key] + values[next]) / 2 * RADIUS / 10 * .62;
      for (const half of rayHalves(AXIS_ANGLES[key] + 45, length, Math.min(10, length * .32))) minor.append(svg('polygon', { points: half, class: 'review-rose__minor-ray' }));
    });
  };

  const update = rating => {
    const target = Object.fromEntries(RATING_AXES.map(({ key }) => [key, Math.max(0, Math.min(10, Number(rating?.[key]) || 0))]));
    for (const { key } of RATING_AXES) {
      const value = target[key];
      rayNodes[key].forEach(node => node.classList.toggle('is-empty', !value));
      labelNodes[key].textContent = value ? (Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',')) : '—';
    }
    const mean = Number.isFinite(rating?.overall) ? rating.overall : null;
    centerText.textContent = mean ? mean.toFixed(1).replace('.', ',') : '—';
    center.classList.toggle('is-empty', !mean);
    title.textContent = `Роза оценки: ${RATING_AXES.map(({ key, label }) => `${label.toLowerCase()} — ${rating?.[key] ? String(rating[key]).replace('.', ',') : 'нет оценки'}`).join(', ')}${mean ? `; общая оценка ${mean.toFixed(1).replace('.', ',')}` : ''}.`;

    cancelAnimationFrame(frame);
    if (reducedMotion() || !root.isConnected) { shown = target;draw(shown);return; }
    const from = { ...shown }, started = performance.now();
    const step = now => {
      const t = Math.min(1, (now - started) / TWEEN_MS), eased = 1 - (1 - t) ** 3;
      shown = Object.fromEntries(RATING_AXES.map(({ key }) => [key, from[key] + (target[key] - from[key]) * eased]));
      draw(shown);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  };

  update({});
  return { element: root, update };
};
