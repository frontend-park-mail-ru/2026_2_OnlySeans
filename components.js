// Небольшая библиотека переиспользуемых UI-компонентов.

function createCard({ title }) {
  const card = document.createElement('div');
  card.className = 'auth-card';

  const heading = document.createElement('h1');
  heading.textContent = title;
  card.appendChild(heading);

  return card;
}

function createErrorBox(id) {
  const box = document.createElement('div');
  box.className = 'error-box';
  box.id = id;
  return box;
}

function createButton({ text, type = 'button' }) {
  const btn = document.createElement('button');
  btn.type = type;
  btn.textContent = text;
  return btn;
}

function createSwitchLink({ text, linkText, href }) {
  const wrap = document.createElement('div');
  wrap.className = 'switch-link';
  wrap.append(document.createTextNode(text + ' '));

  const a = document.createElement('a');
  a.href = href;
  a.textContent = linkText;
  wrap.appendChild(a);

  return wrap;
}