import { createButton } from '../../components/ui/button/button.js';

export class NotFoundPage {
  constructor({ navigate }) {
    this.navigate = navigate;
  }

  render() {
    document.title = '404';

    const page = document.createElement('div');
    page.className = 'not-found';

    // Телевизор
    const tv = document.createElement('div');
    tv.className = 'not-found__tv';

    const noise = document.createElement('img');
    noise.className = 'not-found__noise';
    noise.src = '/src/media/not-found/noise.png';
    noise.alt = '';

    const signal = document.createElement('div');
    signal.className = 'not-found__signal';

    const number = document.createElement('div');
    number.className = 'not-found__number';
    number.textContent = '404';

    const signalText = document.createElement('div');
    signalText.className = 'not-found__signal-text';
    signalText.textContent = 'НЕТ СИГНАЛА';

    signal.append(number, signalText);

    const tvImage = document.createElement('img');
    tvImage.className = 'not-found__tv-image';
    tvImage.src = '/src/media/not-found/tv.png';
    tvImage.alt = 'Телевизор';

    tv.append(noise, signal, tvImage);

    // Текст
    const title = document.createElement('h1');
    title.className = 'not-found__title';
    title.textContent = 'Такой страницы нет';

    const text = document.createElement('p');
    text.className = 'not-found__text';
    text.textContent =
      'Возможно, её удалили или в ссылке опечатка.';

    // Кнопки
    const buttons = document.createElement('div');
    buttons.className = 'not-found__buttons';

    const homeButton = createButton({
      text: 'На главную',
    });

    //const collectionsButton = createButton({
    //    text: 'Смотреть подборки',
    //     variant: 'secondary',
    // });

    homeButton.addEventListener('click', () => {
      this.navigate('/');
    });

    // collectionsButton.addEventListener('click', () => {
    //   this.navigate('/collections');
    // });

    buttons.append(homeButton); //collectionsButton);

    page.append(tv, title, text, buttons);

    return page;
  }
}
