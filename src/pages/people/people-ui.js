import { element } from '../film/film-ui.js';

export const pageLink = (label, href, className = '') => {
  const link = element('a', className, label);link.href = href;link.dataset.link = '';return link;
};

export const portrait = (name, imageURL, className = '') => {
  const box = element('div', `person-portrait ${className}`);
  const initials = element('span', 'person-portrait__initials', name.split(/\s+/).slice(0, 2).map(part => part[0]).join(''));initials.setAttribute('aria-hidden', 'true');box.append(initials);
  if (imageURL) {
    const image = element('img');image.alt = name;image.width = 240;image.height = 300;
    image.addEventListener('load', () => box.classList.add('has-image'), {once:true});
    image.addEventListener('error', () => image.remove(), {once:true});image.src = imageURL;box.append(image);
  }
  return box;
};

export const sectionHead = (title, label, href) => {
  const head = element('div', 'people-section-head');head.append(element('h2', '', title));if (label) head.append(pageLink(label, href));return head;
};

export const emptyState = (title, text, href = '/films', label = 'Выбрать фильм') => {
  const box = element('div', 'people-empty');box.append(element('h3', '', title), element('p', '', text));if (href) box.append(pageLink(label, href, 'people-action'));return box;
};

export const onPageRemoved = (page, dispose) => {
  requestAnimationFrame(() => {
    if (!page.isConnected) { dispose();return; }
    const observer = new MutationObserver(() => { if (!page.isConnected) { observer.disconnect();dispose(); } });
    observer.observe(page.parentElement, {childList:true});
  });
};
