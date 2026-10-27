const poster = (name) => new URL(`../../media/auth/posters/${name}.jpg`, import.meta.url).href;

// Each reel contains four independent local posters. Repeat the same cycle
// to keep the CSS scroll continuous; source credits live beside the images.
const reels = [
  [ ['shawshank', 'Побег из Шоушенка'], ['interstellar', 'Интерстеллар'], ['lion-king', 'Король Лев'], ['gentlemen', 'Джентльмены'] ],
  [ ['inception', 'Начало'], ['sherlock', 'Шерлок'], ['green-mile', 'Зелёная миля'], ['home-alone', 'Один дома'] ],
  [ ['breaking-bad', 'Во все тяжкие'], ['forrest-gump', 'Форрест Гамп'], ['shutter-island', 'Остров проклятых'], ['ivan-vasilievich', 'Иван Васильевич меняет профессию'] ],
];

export const createAuthScene = () => {
  const scene = document.createElement('aside');
  scene.className = 'auth-scene';
  scene.setAttribute('aria-label', 'Frame — кино, которое попало в кадр');
  scene.addEventListener('dragstart', event => event.preventDefault());
  scene.addEventListener('selectstart', event => event.preventDefault());
  scene.innerHTML = `
    <div class="auth-scene__canvas" aria-hidden="true">
      <div class="auth-scene__reels">
        ${reels.map((films, index) => `
          <div class="auth-scene__strip auth-scene__strip--${index + 1}">
            <div class="auth-scene__track">
              ${[0, 1, 2].map(() => `<div class="auth-scene__tile">${films.map(([name, title], frame) => `
                <figure class="auth-scene__frame">
                  <img src="${poster(name)}" width="182" height="324" alt="" title="${title}" draggable="false">
                  <figcaption><span>FRAME · 35MM</span><span>50${index + 1}3 ▷ 0${frame + 1}A</span></figcaption>
                </figure>`).join('')}</div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>
    <div class="auth-scene__shade" aria-hidden="true"></div>
    <div class="auth-scene__copy">
      <p class="auth-scene__rec"><span>● REC</span> 00:00:01:15</p>
      <h2>Кино, которое<br>попало в кадр.</h2>
      <p class="auth-scene__description">Подборки, оценки и отзывы — всё о фильмах в одном месте.</p>
    </div>`;
  return scene;
};
