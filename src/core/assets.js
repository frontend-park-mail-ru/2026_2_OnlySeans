import { Handlebars } from './handlebars.js';

const styles = new Map();

export async function loadText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Не удалось загрузить ${url}`);
  return response.text();
}

export async function loadTemplate(source) {
  return Handlebars.compile(source);
}

export function loadStyles(url) {
  const href = String(url);
  if (styles.has(href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  styles.set(
    href,
    new Promise((resolve) => {
      link.addEventListener('load', resolve);
      link.addEventListener('error', resolve);
    }),
  );
  document.head.append(link);
}

export async function loadAssets({ template } = {}) {
  return template ? loadTemplate(template) : null;
}

export const stylesReady = () => Promise.all(styles.values());

const FONT_WEIGHTS = [400, 500, 600, 700, 800];
const FONT_TIMEOUT = 2500;

function sheetLoaded(link) {
  if (!link || link.sheet) return Promise.resolve();
  return new Promise((resolve) => {
    link.addEventListener('load', resolve);
    link.addEventListener('error', resolve);
  });
}

export function fontsReady() {
  const loading = sheetLoaded(document.getElementById('fonts')).then(() =>
    Promise.allSettled(
      FONT_WEIGHTS.map((weight) => document.fonts.load(`${weight} 1em Manrope`, 'Aa Аа')),
    ),
  );
  const timeout = new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT));
  return Promise.race([loading, timeout]);
}
