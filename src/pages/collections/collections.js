import { createCard } from '../../components/ui/card/card.js';
import { createSwitchLink } from '../../components/ui/switch-link/switch-link.js';

export class CollectionsPage {
  constructor({ navigate }) {
    this.navigate = navigate;
  }

  render() {
    document.title = 'Коллекции';

    const card = createCard({
      title: 'Мои коллекции',
    });

    const text = document.createElement('p');
    text.textContent = 'Здесь будут отображаться ваши коллекции.';
    card.appendChild(text);

    card.appendChild(
      createSwitchLink({
        text: 'Вернуться на',
        linkText: 'главную',
        href: '/',
      })
    );

    return card;
  }
}
