import { createCard } from '../../components/ui/card/card.js';
import { createSwitchLink } from '../../components/ui/switch-link/switch-link.js';

export class NotFoundPage {
  constructor({ navigate }) {
    this.navigate = navigate;
  }

  render() {
    document.title = 'Страница не найдена';

    const card = createCard({ title: '404' });

    const text = document.createElement('p');
    text.className = 'not-found__text';
    text.textContent = 'Такой страницы не существует.';
    card.appendChild(text);

    card.appendChild(createSwitchLink({ text: 'Вернуться на', linkText: 'главную', href: '/collections' }));

    return card;
  }
}
