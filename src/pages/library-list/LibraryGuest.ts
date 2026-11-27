import './library-list-page.css';
import templateSource from './LibraryGuest.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { authPath, loginPathHere } from '../../services/auth-return.js';

const template = await loadAssets({ template: templateSource });

/** Приглашение в личные списки с возвратом после входа. */
export class LibraryGuest extends Component<{ list: 'favorite' | 'watched' }> {
  static template = template;

  context() {
    const watched = this.props.list === 'watched';
    return {
      title: watched
        ? 'Войдите, чтобы вести дневник просмотров'
        : 'Войдите, чтобы собирать избранное',
      text: watched
        ? 'Отмечайте просмотренное — мы посчитаем часы в кино и подскажем, что посмотреть дальше.'
        : 'Отмечайте любимые фильмы, раскладывайте их по полкам и делитесь подборками с друзьями.',
      loginHref: loginPathHere(),
      registerHref: authPath('register', watched ? '/watched' : '/favorites'),
      orbit: new URL('../../assets/images/library/guest-orbit.svg', import.meta.url).href,
      glow: new URL('../../assets/images/library/guest-glow.png', import.meta.url).href,
      disc: new URL('../../assets/images/library/guest-disc.svg', import.meta.url).href,
      symbol: watched
        ? new URL('../../assets/images/library/guest-watched.svg', import.meta.url).href
        : new URL('../../assets/images/library/guest-favorite.svg', import.meta.url).href,
      lockDisc: new URL('../../assets/images/library/guest-lock-disc.svg', import.meta.url).href,
      lock: new URL('../../assets/images/library/guest-lock.svg', import.meta.url).href,
      sparkOne: new URL('../../assets/images/library/guest-spark-one.svg', import.meta.url).href,
      sparkTwo: new URL('../../assets/images/library/guest-spark-two.svg', import.meta.url).href,
      sparkThree: new URL('../../assets/images/library/guest-spark-three.svg', import.meta.url)
        .href,
    };
  }
}
