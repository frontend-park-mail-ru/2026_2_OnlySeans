import { createButton } from '../button/button.js';
import { store } from '../../../modules/store.js';
import { isInList, toggleInList } from '../../../services/library.js';
import { openAuthModal } from '../auth-modal/auth-modal.js';

export const createListToggle = ({ list, movieId, addText, removeText, onChange }) => {
  const button = createButton({ text: addText, variant: 'secondary' });
  button.classList.add('list-toggle');

  const update = () => {
    const active = isInList(list, movieId);
    button.textContent = active ? removeText : addText;
    button.classList.toggle('list-toggle--active', active);
    button.setAttribute('aria-pressed', String(active));
  };

  button.addEventListener('click', () => {
    if (!store.get('user')) {
      openAuthModal();
      return;
    }

    toggleInList(list, movieId);
    update();
    if (onChange) onChange();
  });

  update();

  return button;
};
