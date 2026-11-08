import { Handlebars } from './handlebars.js';
import { icons } from './icons.js';
import { initials, pluralize, relativeDate } from './format.js';

Handlebars.registerHelper('icon', (name, options) => {
  const svg = icons[name];
  if (!svg) throw new Error(`Нет иконки "${name}"`);
  const extra = options.hash.class ? ` ${options.hash.class}` : '';
  return new Handlebars.SafeString(svg.replace('<svg', `<svg class="icon icon--${name}${extra}"`));
});

Handlebars.registerHelper('plural', (count, one, few, many) => pluralize(count, [one, few, many]));
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('not', (value) => !value);
Handlebars.registerHelper('or', (...args) => args.slice(0, -1).some(Boolean));
Handlebars.registerHelper('and', (...args) => args.slice(0, -1).every(Boolean));
Handlebars.registerHelper('join', (items, separator) =>
  Array.isArray(items) ? items.join(typeof separator === 'string' ? separator : ', ') : '',
);
Handlebars.registerHelper('date', (value) => relativeDate(value));
Handlebars.registerHelper('initials', (name) =>
  initials(typeof name === 'string' && name ? name : '?'),
);
