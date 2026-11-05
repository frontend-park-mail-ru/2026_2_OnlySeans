import { getMoviePoster } from '../../services/posters.js';
import { element } from '../../utils/dom.js';

export const buildFeaturedSlides = (movies) => {
  const used = new Set();
  const pick = (predicate) => {
    const movie =
      movies.find((item) => !used.has(item.id) && predicate(item)) ||
      movies.find((item) => !used.has(item.id)) ||
      movies[0];
    used.add(movie.id);
    return movie;
  };
  const hasGenre = (movie, pattern) => movie.genres.some((genre) => pattern.test(genre));
  return [
    {
      label: 'Фильм недели',
      movie: pick(
        (movie) => movie.englishTitle === 'Interstellar' || movie.title === 'Интерстеллар',
      ),
    },
    { label: 'Фильм дня', movie: pick((movie) => movie.type === 'movie') },
    { label: 'Сейчас в тренде', movie: pick((movie) => movie.year >= 2019) },
    { label: 'Выбор редакции', movie: pick((movie) => hasGenre(movie, /драма/i)) },
    { label: 'Классика кино', movie: pick((movie) => movie.year < 2000) },
    { label: 'Для уютного вечера', movie: pick((movie) => hasGenre(movie, /семейн|комедия/i)) },
    { label: 'Держит в напряжении', movie: pick((movie) => hasGenre(movie, /триллер|криминал/i)) },
    { label: 'Сериал на выходные', movie: pick((movie) => movie.type === 'series') },
  ];
};

export const createFeaturedMovie = (movies, page) => {
  const slides = buildFeaturedSlides(movies);
  // Смена рекомендации — раз в 8 секунд; на время наведения, фокуса внутри блока и скрытой вкладки отсчёт замирает.
  const interval = 8000;
  let current = 0;
  const hero = element('section', 'featured-movie featured-carousel');
  hero.setAttribute('aria-label', 'Рекомендуем посмотреть');
  hero.setAttribute('aria-roledescription', 'карусель');
  hero.innerHTML = `
    <div class="spotlight-atmosphere" aria-hidden="true"></div>
    <div class="spotlight-slide" aria-live="off">
      <a class="spotlight-poster" data-link><img width="116" height="174" alt="" draggable="false"><span hidden>Нет постера</span></a>
      <div class="spotlight-text">
        <p class="spotlight-eyebrow"></p><h1 class="spotlight-title" id="featured-title"><a data-link></a></h1>
        <p class="spotlight-original" lang="en"></p><p class="spotlight-meta"></p>
        <p class="spotlight-description"></p><a class="spotlight-about" data-link>О фильме →</a>
      </div>
      <div class="spotlight-actions" aria-label="Сохранить фильм"></div>
    </div>
    <div class="spotlight-navigation">
      <div class="spotlight-rubrics" role="group" aria-label="Выберите рубрику рекомендации"></div>
    </div>`;
  const image = hero.querySelector('.spotlight-poster img');
  const atmosphere = hero.querySelector('.spotlight-atmosphere');
  let backdropVersion = 0;
  const updateAtmosphere = (poster) => {
    const version = ++backdropVersion;
    if (!poster) {
      atmosphere.replaceChildren();
      return;
    }
    const backdrop = new Image();
    backdrop.alt = '';
    backdrop.draggable = false;
    backdrop.onload = () => {
      if (version !== backdropVersion) return;
      const old = [...atmosphere.children];
      atmosphere.append(backdrop);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        old.forEach((node) => node.remove());
        return;
      }
      backdrop.animate(
        [
          { opacity: 0, transform: 'scale(1.06)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: 1600, easing: 'ease-out' },
      );
      old.forEach((node) => {
        node.getAnimations().forEach((animation) => animation.cancel());
        node
          .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1300 })
          .finished.then(() => node.remove())
          .catch(() => node.remove());
      });
    };
    backdrop.src = poster;
  };
  const rubrics = hero.querySelector('.spotlight-rubrics');
  const render = (animate = true) => {
    const { label, movie } = slides[current];
    const poster = getMoviePoster(movie);
    updateAtmosphere(poster);
    const movieUrl = `/film/${movie.id}`;
    for (const link of hero.querySelectorAll('a[data-link]')) link.href = movieUrl;
    hero.querySelector('.spotlight-poster').setAttribute('aria-label', `О фильме: ${movie.title}`);
    image.hidden = false;
    image.src = poster || '';
    image.alt = `Постер: ${movie.title}`;
    hero.querySelector('.spotlight-poster span').hidden = true;
    hero.querySelector('.spotlight-eyebrow').textContent = label;
    const title = hero.querySelector('h1 a');
    title.textContent = movie.title;
    title.title = movie.title;
    hero.querySelector('.spotlight-original').textContent =
      movie.englishTitle || (movie.type === 'series' ? 'Сериал' : 'Фильм');
    const duration = movie.durationMinutes
      ? `${movie.durationMinutes} мин${movie.type === 'series' ? '/серия' : ''}`
      : '';
    hero.querySelector('.spotlight-meta').textContent = [movie.year, duration]
      .filter(Boolean)
      .join(' · ');
    hero.querySelector('.spotlight-description').textContent = movie.description;
    hero.querySelector('.spotlight-description').title = movie.description;
    for (const [index, rubric] of [...rubrics.children].entries()) {
      rubric.setAttribute('aria-pressed', String(index === current));
      if (index === current) rubric.setAttribute('aria-current', 'true');
      else rubric.removeAttribute('aria-current');
    }
    requestAnimationFrame(() => {
      if (!hero.isConnected) return;
      const active = rubrics.children[current];
      const bounds = rubrics.getBoundingClientRect();
      const target = active.getBoundingClientRect();
      if (target.left < bounds.left || target.right > bounds.right)
        rubrics.scrollBy({
          left: target.left - bounds.left - (bounds.width - target.width) / 2,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        });
    });
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const [index, element] of [
        hero.querySelector('.spotlight-poster'),
        hero.querySelector('.spotlight-text'),
      ].entries()) {
        element.getAnimations().forEach((animation) => animation.cancel());
        element.animate(
          [
            { opacity: 0, translate: '0 6px' },
            { opacity: 1, translate: '0 0' },
          ],
          {
            duration: 750,
            delay: index * 120,
            fill: 'backwards',
            easing: 'cubic-bezier(.2,.7,.2,1)',
          },
        );
      }
    }
    const preload = new Image();
    preload.src = getMoviePoster(slides[(current + 1) % slides.length].movie) || '';
  };
  image.addEventListener('error', () => {
    image.hidden = true;
    hero.querySelector('.spotlight-poster span').hidden = false;
  });
  const show = (index) => {
    current = (index + slides.length) % slides.length;
    render();
    schedule();
  };
  slides.forEach((slide, index) => {
    const rubric = element('button');
    rubric.type = 'button';
    rubric.setAttribute('aria-label', `Показать: ${slide.label}`);
    // Отсчёт до следующей рекомендации — тонкая полоска внутри активной рубрики, а не во всю ширину блока.
    const fill = element('span', 'spotlight-rubric__progress');
    fill.setAttribute('aria-hidden', 'true');
    rubric.append(document.createTextNode(slide.label), fill);
    rubric.addEventListener('click', () => show(index));
    rubrics.append(rubric);
  });
  let timer;
  let progressAnimation;
  let disposal;
  let remaining = interval;
  let startedAt;
  const holds = new Set();
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isHeld = () => holds.size > 0;
  const stop = () => {
    clearTimeout(timer);
    progressAnimation?.cancel();
    disposal?.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
  };
  const advance = () => {
    if (!hero.isConnected) {
      stop();
      return;
    }
    current = (current + 1) % slides.length;
    render();
    schedule();
  };
  const runTimer = () => {
    startedAt = performance.now();
    clearTimeout(timer);
    timer = setTimeout(advance, remaining);
  };
  const schedule = () => {
    clearTimeout(timer);
    remaining = interval;
    progressAnimation?.cancel();
    const fill = rubrics.children[current]?.querySelector('.spotlight-rubric__progress');
    progressAnimation =
      reduced() || !fill
        ? null
        : fill.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
            duration: interval,
            easing: 'linear',
            fill: 'forwards',
          });
    if (isHeld()) progressAnimation?.pause();
    else runTimer();
  };
  const hold = (reason) => {
    if (holds.has(reason)) return;
    const wasRunning = !isHeld();
    holds.add(reason);
    if (wasRunning) {
      clearTimeout(timer);
      remaining = Math.max(0, remaining - (performance.now() - startedAt));
      progressAnimation?.pause();
    }
    hero.classList.toggle('is-paused', isHeld());
  };
  const release = (reason) => {
    if (!holds.delete(reason)) return;
    hero.classList.toggle('is-paused', isHeld());
    if (!isHeld()) {
      progressAnimation?.play();
      runTimer();
    }
  };
  hero.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') hold('hover');
  });
  hero.addEventListener('pointerleave', () => release('hover'));
  // Фокус с клавиатуры (Tab) держит рекомендацию; после клика мышью смена продолжается, когда курсор уходит.
  hero.addEventListener('focusin', (event) => {
    if (event.target.matches?.(':focus-visible')) hold('focus');
  });
  hero.addEventListener('focusout', (event) => {
    if (!hero.contains(event.relatedTarget)) release('focus');
  });
  const onVisibility = () => {
    if (document.hidden) hold('hidden');
    else release('hidden');
  };
  document.addEventListener('visibilitychange', onVisibility);

  // Лента рубрик: видимая полоса прокрутки, затухание краёв, колесо мыши листает вбок.
  const syncRubrics = () => {
    const max = rubrics.scrollWidth - rubrics.clientWidth;
    rubrics.classList.toggle('is-scrollable', max > 2);
    rubrics.classList.toggle('at-start', rubrics.scrollLeft <= 2);
    rubrics.classList.toggle('at-end', rubrics.scrollLeft >= max - 2);
  };
  rubrics.addEventListener('scroll', syncRubrics, { passive: true });
  rubrics.addEventListener(
    'wheel',
    (event) => {
      const max = rubrics.scrollWidth - rubrics.clientWidth;
      if (max <= 2 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (
        (event.deltaY < 0 && rubrics.scrollLeft <= 0) ||
        (event.deltaY > 0 && rubrics.scrollLeft >= max)
      )
        return;
      event.preventDefault();
      rubrics.scrollLeft += event.deltaY;
    },
    { passive: false },
  );
  if (typeof ResizeObserver === 'function') new ResizeObserver(syncRubrics).observe(rubrics);
  requestAnimationFrame(syncRubrics);

  requestAnimationFrame(() => {
    if (!hero.isConnected) {
      stop();
      return;
    }
    disposal = new MutationObserver(() => {
      if (!hero.isConnected) stop();
    });
    disposal.observe(page.parentElement, { childList: true });
  });
  render(false);
  schedule();
  return hero;
};
