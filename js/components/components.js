// Небольшая библиотека переиспользуемых UI-компонентов на Handlebars.

// --- Шаблоны ---

const cardTemplate = Handlebars.compile(`
  <div class="auth-card">
    <h1>{{title}}</h1>
  </div>
`);

const errorBoxTemplate = Handlebars.compile(`
  <div class="error-box" id="{{id}}"></div>
`);

const buttonTemplate = Handlebars.compile(`
  <button type="{{type}}">{{text}}</button>
`);

const switchLinkTemplate = Handlebars.compile(`
  <div class="switch-link">{{text}} <a href="{{href}}">{{linkText}}</a></div>
`);

// --- Утилиты ---

// HTML-строка -> готовый DOM-элемент.
const htmlToElement = (markup) => {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup.trim();

  return tpl.content.firstElementChild;
};

// Универсальный рендерер для компонентов
const renderTemplate = (templateFn, data) => htmlToElement(templateFn(data));

// --- API компонентов ---

export const createCard = (data) => renderTemplate(cardTemplate, data);

export const createErrorBox = (id) => renderTemplate(errorBoxTemplate, { id });

export const createButton = ({ text, type = 'button' }) => renderTemplate(buttonTemplate, { text, type });

export const createSwitchLink = (data) => renderTemplate(switchLinkTemplate, data);
