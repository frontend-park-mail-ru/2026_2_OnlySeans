export const renderTemplate = (templateFn, data) => {
  const template = document.createElement('template');
  template.innerHTML = templateFn(data).trim();

  return template.content.firstElementChild;
};