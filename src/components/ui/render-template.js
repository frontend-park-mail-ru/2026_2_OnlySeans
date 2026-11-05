import { element } from '../../utils/dom.js';
export const renderTemplate = (templateFn, data) => {
  const template = element('template');
  template.innerHTML = templateFn(data).trim();

  return template.content.firstElementChild;
};
