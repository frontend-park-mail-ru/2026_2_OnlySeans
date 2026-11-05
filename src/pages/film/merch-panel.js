import { getMovieLookbook } from './merch-looks.js';
import { element } from '../../utils/dom.js';

const outfits = {
  1: [
    ['Рубашка из денима', 'Синий деним', 'shirt', 'рубашка джинсовая синяя'],
    ['Прямые брюки', 'Спокойный повседневный силуэт', 'pants', 'брюки мужские прямые серые'],
    ['Белая футболка', 'База для многослойного образа', 'tee', 'футболка белая однотонная'],
    ['Кожаные ботинки', 'Завершение образа', 'boots', 'ботинки кожаные коричневые'],
  ],
  4: [
    [
      'Куртка в рабочем стиле',
      'Песочные оттенки',
      'jacket',
      'куртка мужская рабочий стиль бежевая',
    ],
    ['Фланелевая рубашка', 'Для многослойного образа', 'shirt', 'рубашка фланелевая бежевая'],
    ['Брюки карго', 'Практичный силуэт', 'pants', 'брюки карго бежевые'],
    ['Высокие ботинки', 'Для долгой дороги', 'boots', 'ботинки высокие коричневые'],
  ],
  5: [
    [
      'Классический пиджак',
      'Сдержанный тёмный цвет',
      'jacket',
      'пиджак мужской темно синий классический',
    ],
    ['Светлая рубашка', 'Чёткие линии', 'shirt', 'рубашка мужская белая классическая'],
    [
      'Прямые брюки',
      'Основа классического образа',
      'pants',
      'брюки мужские классические темно синие',
    ],
    ['Кожаная обувь', 'Лаконичная классика', 'boots', 'туфли мужские кожаные классические'],
  ],
  12: [
    ['Рубашка в клетку', 'Приглушённый зелёный', 'shirt', 'рубашка мужская в клетку зеленая'],
    ['Куртка-ветровка', 'Лёгкий верхний слой', 'jacket', 'ветровка мужская бежевая'],
    ['Тёмная шляпа', 'Акцент в образе', 'hat', 'шляпа мужская черная федора'],
    ['Прямые брюки', 'Нейтральная база', 'pants', 'брюки мужские прямые бежевые'],
  ],
};

const shapes = {
  'coat':
    '<path d="m81 45 23-16 16 15 16-15 23 16 29 138-25 7-18-91 9 118H86l9-118-18 91-25-7Z"/><path d="m104 29 16 15-16 35 16 19 16-19-16-35 16-15M120 98v119M94 150h17m18 0h17" fill="none"/>',
  'leather':
    '<path d="m72 54 28-20 20 16 20-16 28 20 23 130-30 6-14-86v99H93v-99l-14 86-30-6Z"/><path d="m100 34 20 16-17 40 25 23-9 90m21-169-20 16 18 31-10 32M99 142l13-8m16 20 16-8" fill="none"/>',
  'printed-shirt':
    '<path d="m74 52 27-16 19 14 19-14 27 16 22 135-30 6-12-95v107H94V98l-12 95-30-6Z"/><path d="M120 50v155m-19-169 19 14-15 23m34-37-19 14 15 23" fill="none"/><g stroke="none" fill="var(--merch-accent)"><path d="m97 88 12 8-9 14-8-8Zm40 32 13-8 6 15-13 8Zm-39 41 12-8 5 17-11 6Zm36 14 11 5-6 14-9-9Z"/></g>',
  'glasses':
    '<path d="m36 104 72-6-6 36-49 5Zm96-6 72 6-17 35-49-5Z"/><path d="M107 108q13-12 26 0M36 104l-12-11m180 11 12-11" fill="none" stroke-width="6"/>',
  'tie':
    '<path d="m104 27 32 0-8 27 17 132-25 27-25-27 17-132Z"/><path d="M112 54h16M105 114l29-14m-32 47 35-18m-36 48 39-20" fill="none"/>',
  'shoes':
    '<path d="m49 117 32-17 42 31 56 12q31 10 24 39H44l-3-30Z"/><path d="M44 171h160M88 112l-14 16m27-7-13 16m27-7-12 16" fill="none"/>',
  'flats':
    '<path d="M50 109q8-19 25 0l49 41q26-32 57-14 29 17 20 43H43q-12-39 7-70Z"/><path d="M62 117q-8 42 62 33M43 172h160" fill="none"/>',
  'tee':
    '<path d="m74 52 27-16q19 14 38 0l27 16 27 42-30 18-14-19v111H91V93l-14 19-30-18Z"/><path d="M101 36q19 37 38 0" fill="none"/>',
  'shirt':
    '<path d="m74 52 27-16 19 14 19-14 27 16 22 135-30 6-12-95v107H94V98l-12 95-30-6Z"/><path d="m101 36 19 14-15 23-14-27m48-10-19 14 15 23 14-27M120 50v155M135 88h19v24h-19" fill="none"/>',
  'jacket':
    '<path d="m70 54 30-18 20 17 20-17 30 18 25 137-32 6-17-96v105H94V101l-17 96-32-6Z"/><path d="m100 36 20 17-15 36 15 22 15-22-15-36 20-17M120 111v95M99 151h16m12 0h16" fill="none"/>',
  'pants':
    '<path d="M81 35h78l10 168-36 4-13-113-13 113-36-4Z"/><path d="M81 53h78M120 53v41M87 59l-8 28m74-28 8 28" fill="none"/>',
  'hoodie':
    '<path d="M97 56q-12-35 23-35t23 35l29 14 23 121-31 6-16-84v91H92v-91l-16 84-31-6L68 70Z"/><path d="M97 56q23 22 46 0M108 69v37m24-37v37M104 148h32l9 27H95Z" fill="none"/>',
  'hat':
    '<path d="m82 85 10-39q15-17 28-4 13-13 28 4l10 39q48 12 43 30-5 23-81 23t-81-23q-5-18 43-30Z" transform="translate(0 28)"/><path d="M82 112q38 18 76 0" fill="none"/>',
  'boots':
    '<path d="m55 74 58-5 7 78 58 15q22 8 16 31H53Z"/><path d="M53 182h142M82 87l26 6m-25 8 27 7m-27 7 28 8m-28 6 30 8" fill="none"/>',
  'tote':
    '<path d="M59 72h122l-8 132H67Z"/><path d="M92 83V57q0-36 28-36t28 36v26" fill="none" stroke-width="7"/>',
  'mug':
    '<path d="M66 66h100v97q0 34-50 34t-50-34Z"/><path d="M166 83h15q39 0 24 43-8 22-39 21M66 66q50 15 100 0" fill="none" stroke-width="9"/>',
  'poster':
    '<rect x="53" y="23" width="134" height="192" rx="4"/><rect x="65" y="35" width="110" height="168" rx="1" fill="var(--merch-paper)"/><circle cx="120" cy="96" r="29" fill="var(--merch-accent)" stroke="none"/><path d="m75 179 32-50 20 30 18-23 20 43Z" fill="var(--merch-ink)" stroke="none"/>',
  'figure':
    '<circle cx="120" cy="66" r="30"/><path d="M95 101h50l18 65-26 5-5-32v63h-24v-63l-5 32-26-5Z"/><ellipse cx="120" cy="212" rx="58" ry="9" fill="var(--merch-ink)"/>',
};

const illustration = (kind, title, color) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 240 240');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<g fill="var(--merch-fabric)" stroke="var(--merch-ink)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">${shapes[kind] || shapes.tee}</g>`;
  const box = element('div', `merch-card__art merch-card__art--${kind}`);
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', `Иллюстрация: ${title}`);
  if (color) box.style.setProperty('--merch-fabric', color);
  box.append(svg);
  return box;
};

const ozonSearch = (query) => {
  const url = new URL('https://www.ozon.ru/search/');
  url.searchParams.set('text', query);
  return url.href;
};

const externalLink = (label, query, className) => {
  const link = element('a', className, label);
  link.href = ozonSearch(query);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
};

const createCard = (item, category) => {
  const [title, subtitle, kind, query, color] = item;
  const card = element('li', 'merch-card');
  const link = externalLink('', query, 'merch-card__link');
  link.setAttribute('aria-label', `Найти на Ozon: ${title}. Откроется в новой вкладке`);
  const body = element('div', 'merch-card__body');
  body.append(
    element('span', 'merch-card__category', category),
    element('h4', '', title),
    element('p', 'merch-card__subtitle', subtitle),
    element('span', 'merch-card__cta', 'Найти на Ozon ↗'),
  );
  link.append(illustration(kind, title, color), body);
  card.append(link);
  return card;
};

const createLook = (look, index) => {
  const details = element('details', 'merch-look');
  details.open = index === 0;
  const summary = element('summary', 'merch-look__cover');
  const text = element('div', 'merch-look__copy');
  text.append(
    element('p', 'merch-look__person', `${String(index + 1).padStart(2, '0')} / ${look.person}`),
    element('h4', '', look.name),
    element('p', 'merch-look__description', look.description),
  );
  const swatches = element('div', 'merch-look__palette');
  swatches.setAttribute('role', 'img');
  swatches.setAttribute('aria-label', `Палитра образа: ${look.palette.join(', ')}`);
  for (const color of look.palette) {
    const swatch = element('span');
    swatch.style.backgroundColor = color;
    swatches.append(swatch);
  }
  text.append(swatches, element('span', 'merch-look__toggle', 'Вещи для образа ↓'));
  const art = element('div', 'merch-look__collage');
  art.setAttribute('aria-hidden', 'true');
  for (const item of look.items.slice(0, 3)) art.append(illustration(item[2], item[0], item[4]));
  summary.append(text, art);
  const list = element('ul', 'merch-grid merch-look__items');
  list.append(...look.items.map((item) => createCard(item, look.person)));
  details.append(summary, list);
  const syncLabel = () => {
    summary.querySelector('.merch-look__toggle').textContent = details.open
      ? 'Скрыть вещи ↑'
      : 'Собрать образ ↓';
  };
  details.addEventListener('toggle', syncLabel);
  syncLabel();
  return details;
};

export const createMerchPanel = (movie) => {
  const lookbook = getMovieLookbook(movie);
  const root = element('section', 'film-merch');
  if (lookbook) root.dataset.lookbook = lookbook.theme;
  root.setAttribute('aria-labelledby', 'film-merch-title');
  const intro = element('header', 'merch-intro');
  const copy = element('div');
  const heading = element('h2', '', 'Аутфиты и мерч');
  heading.id = 'film-merch-title';
  copy.append(
    element('p', 'film-eyebrow', 'Вдохновлено кино'),
    heading,
    element(
      'p',
      'merch-intro__text',
      `Образы в духе «${movie.title}» и идеи вещей на память о ${movie.type === 'series' ? 'сериале' : 'фильме'}.`,
    ),
  );
  if (lookbook) {
    copy.querySelector('.film-eyebrow').textContent = 'Кино в деталях';
    copy.querySelector('.merch-intro__text').textContent = lookbook.description;
  }
  const partner = externalLink('Искать на Ozon ↗', `${movie.title} мерч`, 'merch-partner');
  intro.append(copy, partner);
  const note = element(
    'p',
    'merch-note',
    'Идеи для поиска. На карточках — иллюстрации; цены, наличие и оформление заказа — на Ozon.',
  );
  const filters = element('div', 'merch-filters');
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', 'Категория товаров');
  const sections = element('div', 'merch-sections');
  const outfitItems = outfits[movie.id] || [
    ['Худи с принтом', 'Уютный повседневный образ', 'hoodie', `худи ${movie.title}`],
    ['Футболка с принтом', 'Кино в деталях', 'tee', `футболка ${movie.title}`],
    ['Шопер', 'Акцент на каждый день', 'tote', `шопер ${movie.title}`],
    ['Свитшот', 'Для прохладного вечера', 'hoodie', `свитшот ${movie.title}`],
  ];
  const merchItems = [
    ['Постер', 'Любимый фильм на вашей стене', 'poster', `постер ${movie.title}`],
    ['Кружка', 'Для следующего киновечера', 'mug', `кружка ${movie.title}`],
    ['Фигурка', 'Для личной коллекции', 'figure', `фигурка ${movie.title}`],
    ['Футболка', 'Принт по мотивам истории', 'tee', `футболка ${movie.title}`],
  ];
  const groups = [];
  for (const [key, title, description, items] of [
    [
      'outfits',
      'Собрать образ',
      'Вдохновляемся атмосферой фильма: подбираем похожие силуэты, цвета и фактуры.',
      outfitItems,
    ],
    [
      'merch',
      'Оставить на память',
      'Постеры, аксессуары и другие вещи по названию фильма.',
      merchItems,
    ],
  ]) {
    const section = element('section', 'merch-section');
    section.dataset.category = key;
    section.append(element('h3', '', title), element('p', 'merch-section__text', description));
    const list = element('ul', 'merch-grid');
    list.append(
      ...items.map((item) =>
        createCard(item, key === 'outfits' ? 'Идея для образа' : 'Мерч · поиск'),
      ),
    );
    if (key === 'outfits' && lookbook) {
      section.querySelector('h3').textContent = lookbook.title;
      section.querySelector('.merch-section__text').textContent =
        'Выберите персонажа и раскройте вещи для его образа. Подбираем похожие вещи по силуэту и цвету.';
      const looks = element('div', 'merch-looks');
      looks.append(...lookbook.looks.map(createLook));
      section.append(looks);
    } else section.append(list);
    sections.append(section);
    groups.push(section);
  }
  for (const [key, label] of [
    ['all', 'Всё'],
    ['outfits', 'Аутфиты'],
    ['merch', 'Мерч'],
  ]) {
    const button = element('button', '', label);
    button.type = 'button';
    button.dataset.category = key;
    button.setAttribute('aria-pressed', String(key === 'all'));
    button.addEventListener('click', () => {
      for (const item of filters.children)
        item.setAttribute('aria-pressed', String(item === button));
      for (const group of groups) group.hidden = key !== 'all' && group.dataset.category !== key;
    });
    filters.append(button);
  }
  root.append(intro, note, filters, sections);
  return root;
};
