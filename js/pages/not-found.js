export class NotFoundView {
  render() {
    document.title = 'Страница не найдена — OnlySeans';

    return `
      <main class="not-found">
        <div class="not-found__tv">
          <div class="not-found__screen">
            <span class="not-found__code">404</span>
            <span class="not-found__signal">Нет сигнала</span>
          </div>
          <img class="not-found__tv-frame" src="/assets/tv.png" alt="">
        </div>

        <h1 class="not-found__title">Такой страницы нет</h1>
        <p class="not-found__text">
          Возможно, её удалили или в ссылке опечатка.
          Загляните в подборки — там вы точно найдёте что-то интересное
        </p>

        <div class="not-found__actions">
          <a class="not-found__button not-found__button_primary" href="/">На главную</a>
          <a class="not-found__button not-found__button_secondary" href="/collections">Смотреть подборки</a>
        </div>
      </main>
    `;
  }
}
