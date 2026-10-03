import { createButton } from '../button/button.js';

export const createLogoutButton = ({ onClick } = {}) => {
  const button = createButton({ text: 'Выйти', variant: 'secondary' });
  button.classList.add('site-header__logout');

  if (onClick) button.addEventListener('click', onClick);

  return button;
};
