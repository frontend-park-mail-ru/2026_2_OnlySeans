import { createModal } from '../modal/modal.js';
import { LoginPage } from '../../../pages/login/login.js';
import { RegisterPage } from '../../../pages/register/register.js';

const VIEWS = {
  '/login': LoginPage,
  '/register': RegisterPage,
};

const refreshRoute = () => window.dispatchEvent(new PopStateEvent('popstate'));

export const createAuthModal = ({ path = '/login', onClose } = {}) => {
  const title = document.title;
  const modal = createModal({
    label: 'Вход и регистрация',
    onClose: () => {
      document.title = title;
      if (onClose) onClose();
    },
  });

  const show = (viewPath) => {
    const view = new VIEWS[viewPath]({ navigate: refreshRoute });
    modal.querySelector('.modal__content').replaceChildren(view.render());
    modal.querySelector('input').focus();
  };

  modal.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-link]');
    const viewPath = link && new URL(link.href).pathname;
    if (!VIEWS[viewPath]) return;

    event.preventDefault();
    event.stopPropagation();
    show(viewPath);
  });

  show(path);

  return modal;
};

export const openAuthModal = (props) => {
  const modal = createAuthModal(props);
  document.getElementById('app').appendChild(modal);
  modal.querySelector('input').focus();
};
