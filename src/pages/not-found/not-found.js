// import { BaseComponent } from '../../components/ui/base-component.js';
// import { createButton } from '../../components/ui/button/button.js';

// const notFoundTemplate = window.Handlebars.compile(`
//   <div class="not-found">
//     <div class="not-found__tv">
//       <img class="not-found__noise" src="/src/media/not-found/noise.png" alt="">
//       <div class="not-found__signal">
//         <div class="not-found__number">404</div>
//         <div class="not-found__signal-text">НЕТ СИГНАЛА</div>
//       </div>
//       <img class="not-found__tv-image" src="/src/media/not-found/tv.png" alt="Телевизор">
//     </div>

//     <h1 class="not-found__title">Такой страницы нет</h1>
//     <p class="not-found__text">
//       Возможно, её удалили или в ссылке опечатка. Загляните в подборки — там вы точно найдёте что-то интересное
//     </p>

//     <div class="not-found__buttons"></div>
//   </div>
// `);

// export class NotFoundPage extends BaseComponent {
//   constructor({ navigate }) {
//     super(notFoundTemplate, {});
//     this.navigate = navigate;
//   }

//   render() {
//     document.title = '404';

//     const page = this.create();

//     const homeButton = createButton({ text: 'На главную' });
//     const collectionsButton = createButton({ text: 'Смотреть подборки', variant: 'secondary' });

//     homeButton.addEventListener('click', () => this.navigate('/'));
//     collectionsButton.addEventListener('click', () => this.navigate('/collections'));

//     const signal = document.createElement('div');
//     signal.className = 'not-found__signal';

//     const number = document.createElement('div');
//     number.className = 'not-found__number';
//     number.textContent = '404';

//     const signalText = document.createElement('div');
//     signalText.className = 'not-found__signal-text';
//     signalText.textContent = 'НЕТ СИГНАЛА';

//     signal.append(number, signalText);

//     const tvImage = document.createElement('img');
//     tvImage.className = 'not-found__tv-image';
//     tvImage.src = '/src/media/not-found/tv.png';
//     tvImage.alt = 'Телевизор';

//     tv.append(noise, signal, tvImage);

//     // Текст
//     const title = document.createElement('h1');
//     title.className = 'not-found__title';
//     title.textContent = 'Такой страницы нет';

//     const text = document.createElement('p');
//     text.className = 'not-found__text';
//     text.textContent =
//       'Возможно, её удалили или в ссылке опечатка.';

//     // Кнопки
//     const buttons = document.createElement('div');
//     buttons.className = 'not-found__buttons';

//     //const collectionsButton = createButton({
//     //    text: 'Смотреть подборки',
//     //     variant: 'secondary',
//     // });

//     homeButton.addEventListener('click', () => {
//       this.navigate('/');
//     });

//     // collectionsButton.addEventListener('click', () => {
//     //   this.navigate('/collections');
//     // });

//     buttons.append(homeButton); //collectionsButton);

//     page.append(tv, title, text, buttons);

//     return page;
//   }
// }
import { BaseComponent } from '../../components/ui/base-component.js';
import { createButton } from '../../components/ui/button/button.js';

const notFoundTemplate = window.Handlebars.compile(`
  <div class="not-found">
    <div class="not-found__tv">
      <img class="not-found__noise" src="/src/media/not-found/noise.png" alt="">
      <div class="not-found__signal">
        <div class="not-found__number">404</div>
        <div class="not-found__signal-text">НЕТ СИГНАЛА</div>
      </div>
      <img class="not-found__tv-image" src="/src/media/not-found/tv.png" alt="Телевизор">
    </div>

    <h1 class="not-found__title">Такой страницы нет</h1>
    <p class="not-found__text">
      Возможно, её удалили или в ссылке опечатка. Загляните в подборки — там вы точно найдёте что-то интересное
    </p>

    <div class="not-found__buttons"></div>
  </div>
`);

export class NotFoundPage extends BaseComponent {
  constructor({ navigate }) {
    super(notFoundTemplate, {});
    this.navigate = navigate;
  }

  render() {
    document.title = '404';

    const page = this.create();

    const homeButton = createButton({ text: 'На главную' });
    // const collectionsButton = createButton({ text: 'Смотреть подборки', variant: 'secondary' });

    homeButton.addEventListener('click', () => this.navigate('/'));
    // collectionsButton.addEventListener('click', () => this.navigate('/collections'));

    page.querySelector('.not-found__buttons').append(homeButton); //, collectionsButton

    return page;
  }
}
