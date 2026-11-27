import './wheel-page.css';
import templateSource from './WheelPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import type { PageProps } from '../../app/router.js';
import type { Film } from '../../api/films.js';
import { loadCatalog } from '../../services/catalog.js';
import { loadCatalogRatings } from '../../services/catalog-ratings.js';
import { libraryLoaded, loadLibrary, readLibrary, watchLibrary } from '../../services/library.js';
import type { CatalogRatings } from '../../services/catalog-filters.js';
import type { WheelShare } from './WheelShare.js';
import { readShelves, shelfFilmIds, watchShelves } from '../../services/shelves.js';
import { parseFavoriteShare } from '../../services/favorites.js';
import { readAppearance } from '../../services/appearance.js';
import { store } from '../../core/store.js';
import { notify } from '../../services/notice.js';
import {
  pickWheel,
  readWheelHistory,
  readWheelShare,
  rememberWheel,
  wheelRandom,
  type WheelEntry,
  type WheelResult,
} from '../../services/wheel.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { WheelWinner } from './WheelWinner.js';

const template = await loadAssets({ template: templateSource });
const asset = (name: string) =>
  String(new URL(`../../assets/images/wheel/${name}.svg`, import.meta.url));
const COLORS = ['#98662f', '#69323d', '#303958', '#8a5037', '#453253', '#244d50', '#68552c'];
type Source = 'watchlater' | 'favorite' | 'catalog' | 'pool' | `shelf:${string}`;
type WeightMode = 'equal' | 'manual' | 'taste' | 'audience';
const SOURCES = {
  watchlater: 'Смотреть позже',
  favorite: 'Избранное',
  catalog: 'Случайные из каталога',
};

function point(degrees: number, radius: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: 244 + radius * Math.cos(radians), y: 244 + radius * Math.sin(radians) };
}

/** Колесо использует каталог API; история отделена по аккаунтам. */
export class WheelPage extends Component<PageProps> {
  static template = template;
  #films: Film[] = [];
  #entries: WheelEntry[] = [];
  #source: Source = store.get('user') ? 'watchlater' : 'catalog';
  #mode: WeightMode = 'equal';
  #phase: 'loading' | 'ready' | 'error' = 'loading';
  #excludeWatched = true;
  #posters = true;
  #speed = 'medium';
  #busy = false;
  #rotation = 0;
  #winner: WheelWinner | null = null;
  #controller: AbortController | null = null;
  #pool: number[] | null = null;
  #variant: 'classic' | 'elimination' = 'classic';
  #share: WheelShare | null = null;
  #publicRatings: CatalogRatings = new Map();
  #triedRatings = new Set<number>();
  #spinId = 0;
  #settingsOpen = false;
  #settingsScroll = 0;
  #settingsFocus = '';

  update(patch: Partial<PageProps> = {}) {
    const settings = this.query<HTMLDialogElement>('[data-settings]');
    if (settings?.open) {
      this.#settingsScroll = this.find('[data-settings-panel]').scrollTop;
      const focused = document.activeElement;
      this.#settingsFocus = '';
      if (focused instanceof HTMLElement && settings.contains(focused)) {
        for (const name of [
          'data-source',
          'data-mode',
          'data-adjust',
          'data-remove',
          'data-select',
          'name',
        ]) {
          if (!focused.hasAttribute(name)) continue;
          const value = CSS.escape(focused.getAttribute(name) || '');
          const id = focused.dataset.id;
          this.#settingsFocus = `[${name}="${value}"]${id ? `[data-id="${CSS.escape(id)}"]` : ''}`;
          break;
        }
      }
    }
    return super.update(patch);
  }

  #sources() {
    const library = readLibrary();
    return [
      ...Object.entries(SOURCES)
        .filter(([key]) => key === 'catalog' || store.get('user'))
        .map(([value, label]) => ({
          value,
          label,
          count:
            value === 'catalog'
              ? this.#films.length
              : library[value as 'favorite' | 'watchlater'].length,
        })),
      ...readShelves().map((shelf) => ({
        value: `shelf:${shelf.id}`,
        label: `Полка: ${shelf.name}`,
        count: shelfFilmIds(shelf, library.favorite).length,
      })),
      ...(this.#pool
        ? [
            {
              value: 'pool',
              label: 'Из подборки или фильтра',
              count: this.#pool.filter((id) => this.#films.some((film) => film.id === id)).length,
            },
          ]
        : []),
    ];
  }

  context() {
    let previousDay = '';
    const total = this.#entries.reduce((sum, entry) => sum + entry.weight, 0);
    let start = 0;
    const participants = this.#entries.map((entry, index) => {
      const film = this.#films.find((item) => item.id === entry.id)!;
      const angle = (entry.weight / total) * 360;
      const from = point(start, 244);
      const to = point(start + angle, 244);
      const label = point(start + angle / 2, 155);
      const posterWidth = Math.max(
        28,
        Math.min(124, 2 * 150 * Math.sin((Math.min(angle, 150) * Math.PI) / 360) * 0.8),
      );
      const result = {
        ...entry,
        manual: this.#mode === 'manual',
        film,
        rating: this.#publicRatings.get(film.id)?.votes
          ? this.#publicRatings
              .get(film.id)!
              .average.toLocaleString('ru', { maximumFractionDigits: 1 })
          : '—',
        chance: Math.round((entry.weight / total) * 100),
        color: COLORS[index % COLORS.length],
        path:
          angle >= 360
            ? 'M244 0 A244 244 0 1 1 244 488 A244 244 0 1 1 244 0 Z'
            : `M244 244 L${from.x} ${from.y} A244 244 0 ${angle > 180 ? 1 : 0} 1 ${to.x} ${to.y} Z`,
        labelX: label.x,
        labelY: label.y,
        clipId: `wheel-sector-${film.id}`,
        hasPoster: Boolean(film.poster),
        posterWidth,
        posterHeight: posterWidth * 1.5,
        posterX: label.x - posterWidth / 2,
        posterY: label.y - posterWidth * 0.75,
        rotation: start + angle / 2 - 90,
        label: film.title.length > 22 ? `${film.title.slice(0, 21)}…` : film.title,
      };
      start += angle;
      return result;
    });
    return {
      loading: this.#phase === 'loading',
      backHref: location.pathname.endsWith('/history') ? '/wheel' : '/',
      error: this.#phase === 'error',
      ready: this.#phase === 'ready',
      historyPage: location.pathname.endsWith('/history'),
      sourceLabel:
        this.#sources().find((source) => source.value === this.#source)?.label || 'Личный список',
      modeLabel: {
        equal: 'Равные шансы',
        manual: 'Свои веса',
        taste: 'По моим вкусам',
        audience: 'По оценкам',
      }[this.#mode],
      modeHint: {
        equal: 'У каждого фильма одинаковая вероятность победить.',
        manual: 'Меняйте вес кнопками − и +. Чем больше вес, тем выше шанс.',
        taste: 'Чаще выпадают фильмы с жанрами из вашего избранного.',
        audience: 'Шанс зависит от средней оценки зрителей.',
      }[this.#mode],
      variantLabel: this.#variant === 'elimination' ? 'Выбывание' : 'Классика',
      sources: this.#sources().map((source) => ({
        ...source,
        active: source.value === this.#source,
      })),
      modes: [
        { value: 'equal', label: 'Равные', short: 'Равные' },
        { value: 'manual', label: 'Вручную', short: 'Вручную' },
        { value: 'taste', label: 'По моим вкусам', short: 'Вкусы' },
        { value: 'audience', label: 'По оценкам зрителей', short: 'Оценки' },
      ].map((item) => ({ ...item, active: item.value === this.#mode })),
      participants,
      manual: this.#mode === 'manual',
      count: participants.length,
      enough: participants.length >= 2,
      history: readWheelHistory().map((result, index) => {
        const day = new Date(result.at).toLocaleDateString('ru', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const group = day !== previousDay ? day : '';
        previousDay = day;
        return {
          ...result,
          group,
          watched: readLibrary().watched.includes(result.winner),
          film: this.#films.find((film) => film.id === result.winner),
          index,
          date: new Date(result.at).toLocaleString('ru', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
      }),
      assets: {
        ring: asset('ring'),
        vignette: asset('vignette'),
        hub: asset('hub'),
        button: asset('button'),
        play: asset('play'),
        pointer: asset('pointer'),
        glint: asset('glint'),
        spin: asset('spin'),
      },
      lamps: Array.from({ length: 36 }, (_, index) => {
        const position = point(index * 10, 254);
        return {
          x: position.x + 26,
          y: position.y + 46,
          src: asset(index % 3 === 0 ? 'lamp-on' : 'lamp-off'),
        };
      }),
      films: this.#films.map((film) => ({
        ...film,
        searchTitle: film.title.toLocaleLowerCase('ru'),
        selected: this.#entries.some((entry) => entry.id === film.id),
      })),
    };
  }

  onRender() {
    this.watch(
      watchLibrary(() => {
        if (!this.#busy) this.update();
      }),
    );
    this.watch(
      store.watch('user', () => {
        this.#spinId++;
        this.#controller?.abort();
        this.#winner?.close();
        this.#share?.close();
        this.#busy = false;
        this.#entries = [];
        this.#source = 'catalog';
        this.#selectSource();
        this.update();
      }),
    );
    this.watch(
      watchShelves(() => {
        if (!this.#busy && this.#source.startsWith('shelf:')) {
          this.#selectSource();
          this.update();
        }
      }),
    );
    document.title = 'Колесо выбора | Frame';
    this.insert(
      'heading',
      new SectionHeading({
        title: location.pathname.endsWith('/history') ? 'История вращений' : 'Что смотрим сегодня?',
        level: 1,
      }),
    );
    if (this.#phase === 'loading') {
      void this.#load();
      return;
    }
    this.delegate('click', '[data-retry]', () => {
      this.#phase = 'loading';
      this.update();
    });
    if (this.#phase !== 'ready') return;
    this.findAll<HTMLButtonElement>('[data-spin]').forEach((button) => {
      button.disabled = this.#entries.length < 2;
    });
    const settings = this.query<HTMLDialogElement>('[data-settings]');
    if (settings) {
      this.delegate('click', '[data-settings-open]', () => this.#openSettings());
      this.delegate('click', '[data-settings-close]', () => settings.close());
      this.on(
        'close',
        () => {
          if (this.destroyed || !this.element.isConnected) return;
          this.#settingsOpen = false;
          const panel = this.query('.wheel-page__panel');
          const layout = this.query('.wheel-page__layout');
          if (panel && layout) layout.prepend(panel);
          this.#refreshSummary();
          this.query('[data-settings-open]')?.focus({ preventScroll: true });
        },
        settings,
      );
      if (this.#settingsOpen) {
        const frame = requestAnimationFrame(() => this.#openSettings());
        this.watch(() => cancelAnimationFrame(frame));
      }
    }
    void this.#displayRatings();
    const variant = this.query<HTMLSelectElement>('[name=variant]');
    if (variant) variant.value = this.#variant;
    const rotor = this.element.querySelector<SVGElement>('.wheel-page__rotor');
    if (rotor) rotor.style.transform = `rotate(${this.#rotation}deg)`;
    this.delegate('change', '[name=variant]', (_, input) => {
      if (this.#busy) return;
      this.#variant =
        (input as HTMLSelectElement).value === 'elimination' ? 'elimination' : 'classic';
      this.#refreshSummary();
    });
    const observer = new ResizeObserver(() => {
      const host = this.query('.wheel-page__stage');
      if (host)
        host.style.setProperty('--wheel-scale', String(Math.min(1, host.clientWidth / 540)));
    });
    const stage = this.query('.wheel-page__stage');
    const wheel = this.query('.wheel-page__wheel');
    if (wheel) wheel.dataset.posters = String(this.#posters);
    const speed = this.query<HTMLSelectElement>('[name=speed]');
    if (speed) speed.value = this.#speed;
    if (stage) observer.observe(stage);
    this.watch(() => observer.disconnect());
    this.findAll<HTMLInputElement>('[name=excludeWatched]').forEach((input) => {
      input.checked = this.#excludeWatched;
    });
    this.delegate('click', '[data-source]', (_, button) => {
      if (this.#busy) return;
      this.#source = button.dataset.source as Source;
      this.#mode = 'equal';
      this.#selectSource();
      this.update();
    });
    this.delegate('click', '[data-mode]', (_, button) => {
      if (!this.#busy) void this.#setMode(button.dataset.mode as WeightMode);
    });
    this.delegate('change', '[name=excludeWatched]', (_, input) => {
      this.#excludeWatched = (input as HTMLInputElement).checked;
      this.#mode = 'equal';
      this.#selectSource();
      this.update();
    });
    this.delegate('click', '[data-adjust]', (_, button) => {
      if (this.#busy) return;
      const entry = this.#entries.find((item) => item.id === Number(button.dataset.id));
      if (entry)
        entry.weight = Math.min(100, Math.max(1, entry.weight + Number(button.dataset.adjust)));
      this.update();
      this.query(`[data-id="${button.dataset.id}"][data-adjust="${button.dataset.adjust}"]`)?.focus(
        { preventScroll: true },
      );
    });
    this.delegate('click', '[data-remove]', (_, button) => {
      if (!this.#busy) {
        this.#entries = this.#entries.filter((item) => item.id !== Number(button.dataset.remove));
        this.update();
      }
    });
    this.query('[data-posters-toggle]')?.setAttribute('aria-pressed', String(this.#posters));
    this.delegate('click', '[data-posters-toggle]', (_, button) => {
      if (!this.#busy) {
        this.#posters = !this.#posters;
        this.find('.wheel-page__wheel').dataset.posters = String(this.#posters);
        button.setAttribute('aria-pressed', String(this.#posters));
      }
    });
    this.delegate('change', '[name=speed]', (_, input) => {
      this.#speed = (input as HTMLSelectElement).value;
    });
    this.delegate('click', '[data-spin]', () => {
      void this.#spin();
    });
    this.delegate('click', '[data-select]', () => {
      if (!this.#busy) this.find<HTMLDialogElement>('[data-picker]').showModal();
    });
    this.delegate('click', '[data-picker-close]', () =>
      this.find<HTMLDialogElement>('[data-picker]').close(),
    );
    this.delegate('input', '[data-picker-search]', (_, input) => {
      const query = (input as HTMLInputElement).value.trim().toLocaleLowerCase('ru');
      let visible = 0;
      this.findAll('[data-picker-film]').forEach((row) => {
        row.hidden = !row.dataset.title?.includes(query);
        if (!row.hidden) visible++;
      });
      this.find('[data-picker-empty]').hidden = visible > 0;
    });
    this.delegate('change', '[data-pick]', (_, target) => {
      const input = target as HTMLInputElement;
      const id = Number(input.dataset.pick);
      if (input.checked && this.#entries.length >= 16) {
        input.checked = false;
        notify('В колесе может быть до 16 фильмов.');
        return;
      }
      if (input.checked) this.#entries.push({ id, weight: 1 });
      else this.#entries = this.#entries.filter((entry) => entry.id !== id);
      this.find('[data-picker-count]').textContent = `Выбрано: ${this.#entries.length}`;
      this.#mode = 'manual';
    });
    const picker = this.query<HTMLDialogElement>('[data-picker]');
    if (picker) {
      this.findAll<HTMLInputElement>('[data-pick]').forEach((input) => {
        input.checked = this.#entries.some((entry) => entry.id === Number(input.dataset.pick));
      });
      this.on('close', () => this.update(), picker);
    }
    this.delegate('click', '[data-history-replay]', (_, button) => {
      const result = readWheelHistory()[Number(button.dataset.historyReplay)];
      if (!result) return;
      const query = new URLSearchParams({
        replay: '1',
        choice: JSON.stringify({ winner: result.winner, entries: result.entries }),
      });
      this.props.navigate(`/wheel?${query}`);
    });
    this.delegate('click', '[data-history-share]', async (_, button) => {
      const result = readWheelHistory()[Number(button.dataset.historyShare)];
      const film = this.#films.find((film) => film.id === result?.winner);
      if (!film) return;
      try {
        const { WheelShare } = await import('./WheelShare.js');
        if (!this.destroyed)
          this.#share = new WheelShare({ result, film, films: this.#films }).open();
      } catch {
        if (!this.destroyed)
          notify('Не удалось открыть результат. Попробуйте ещё раз.', { type: 'error' });
      }
    });
  }

  async #displayRatings() {
    const films = this.#films.filter(
      (film) =>
        this.#entries.some((entry) => entry.id === film.id) && !this.#triedRatings.has(film.id),
    );
    if (!films.length) return;
    films.forEach((film) => this.#triedRatings.add(film.id));
    const controller = new AbortController();
    this.watch(() => controller.abort());
    try {
      const ratings = await loadCatalogRatings(films, { signal: controller.signal });
      if (controller.signal.aborted) return;
      ratings.forEach((value, id) => this.#publicRatings.set(id, value));
      if (!this.#busy) this.update();
    } catch {
      /* Отсутствие рейтинга не мешает выбору фильма. */
    }
  }

  #refreshSummary() {
    const summary = this.query('.wheel-page__secondary [data-settings-open]');
    if (summary)
      summary.textContent = `${this.context().modeLabel} · ${this.context().variantLabel}`;
  }

  #openSettings() {
    const dialog = this.query<HTMLDialogElement>('[data-settings]');
    const panel = this.query('.wheel-page__panel');
    if (!dialog || !panel || dialog.open) return;
    this.find('[data-settings-panel]').append(panel);
    this.#settingsOpen = true;
    dialog.showModal();
    this.find('[data-settings-panel]').scrollTop = this.#settingsScroll;
    if (this.#settingsFocus)
      dialog.querySelector<HTMLElement>(this.#settingsFocus)?.focus({ preventScroll: true });
  }

  async #load() {
    const controller = new AbortController();
    this.#controller = controller;
    this.watch(() => controller.abort());
    try {
      if (store.get('user') && !libraryLoaded()) await loadLibrary();
      if (controller.signal.aborted) return;
      this.#films = await loadCatalog({ signal: controller.signal });
      if (controller.signal.aborted) return;
      this.#phase = 'ready';
      if (this.props.query.has('pool')) {
        try {
          this.#pool = parseFavoriteShare(
            new URLSearchParams({ shared: this.props.query.get('pool') || '' }),
          );
          this.#source = 'pool';
        } catch {
          this.#pool = [];
          this.#source = 'pool';
          notify('Список фильмов в ссылке повреждён. Выберите другой источник.');
        }
      } else if (this.props.query.get('shelf'))
        this.#source = `shelf:${this.props.query.get('shelf')}`;
      const shared = readWheelShare(this.props.query);
      const available = shared?.entries.every((entry) =>
        this.#films.some((film) => film.id === entry.id),
      );
      if (shared && available) {
        this.#entries = shared.entries;
        this.#mode = 'manual';
      } else {
        this.#selectSource();
        if (this.props.query.has('choice'))
          notify('Некоторые фильмы из ссылки недоступны. Выберите новые.');
      }
      this.update();
      if (shared && available) {
        if (this.props.query.get('replay') === '1') void this.#spin();
        else this.#showWinner({ ...shared, at: Date.now(), source: 'По ссылке' });
      }
    } catch {
      if (!controller.signal.aborted) {
        this.#phase = 'error';
        this.update();
      }
    }
  }

  #selectSource() {
    const library = readLibrary();
    const source = this.#source;
    const shelf = source.startsWith('shelf:')
      ? readShelves().find((item) => item.id === source.slice(6))
      : null;
    const ids =
      source === 'pool'
        ? this.#pool || []
        : source.startsWith('shelf:')
          ? shelf
            ? shelfFilmIds(shelf, library.favorite)
            : []
          : source === 'catalog'
            ? null
            : library[source as 'favorite' | 'watchlater'];
    let films = this.#films.filter(
      (film) =>
        (ids === null || ids.includes(film.id)) &&
        (!this.#excludeWatched || !library.watched.includes(film.id)),
    );
    if (this.#source === 'catalog') {
      films = [...films];
      for (let index = films.length - 1; index > 0; index--) {
        const next = Math.floor(wheelRandom() * (index + 1));
        [films[index], films[next]] = [films[next], films[index]];
      }
    }
    this.#entries = films.slice(0, 7).map((film) => ({ id: film.id, weight: 1 }));
  }

  async #setMode(mode: WeightMode) {
    this.#mode = mode;
    if (mode === 'equal')
      this.#entries.forEach((entry) => {
        entry.weight = 1;
      });
    if (mode === 'taste') {
      const favorite = new Set(readLibrary().favorite);
      const genres = this.#films
        .filter((film) => favorite.has(film.id))
        .flatMap((film) => film.genres);
      this.#entries.forEach((entry) => {
        entry.weight =
          1 +
          this.#films
            .find((film) => film.id === entry.id)!
            .genres.filter((genre) => genres.includes(genre)).length;
      });
      if (!genres.length)
        notify('Добавьте фильмы в избранное, чтобы учитывать любимые жанры. Пока шансы равны.');
    }
    if (mode !== 'audience') {
      this.update();
      return;
    }
    this.#setBusy(true);
    const controller = new AbortController();
    this.#controller = controller;
    try {
      const ratings = await loadCatalogRatings(
        this.#films.filter((film) => this.#entries.some((entry) => entry.id === film.id)),
        { signal: controller.signal },
      );
      if (this.destroyed) return;
      this.#entries.forEach((entry) => {
        entry.weight = Math.max(1, ratings.get(entry.id)?.average ?? 1);
      });
    } catch {
      if (!this.destroyed) {
        this.#mode = 'equal';
        this.#entries.forEach((entry) => {
          entry.weight = 1;
        });
        notify('Не удалось загрузить оценки. Повторите выбор весов.', { type: 'error' });
      }
    } finally {
      this.#busy = false;
      if (!this.destroyed) this.update();
    }
  }

  #setBusy(value: boolean) {
    this.#busy = value;
    this.element.setAttribute('aria-busy', String(value));
    const status = this.query('[data-spin-status]');
    if (status) status.textContent = value ? 'Выбираем фильм…' : '';
    this.query('.wheel-page__visual')?.classList.toggle('is-spinning', value);
    this.findAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>(
      'button, input, select',
    ).forEach((input) => {
      input.disabled = value || (input.hasAttribute('data-spin') && this.#entries.length < 2);
    });
  }

  async #spin() {
    if (this.#busy || this.#entries.length < 2) return;
    const spinId = ++this.#spinId;
    this.#setBusy(true);
    const entries = this.#entries.map((entry) => ({ ...entry }));
    const winner = pickWheel(entries, wheelRandom());
    this.findAll('.is-eliminated').forEach((row) => row.classList.remove('is-eliminated'));
    if (this.#variant === 'elimination') {
      const remaining = entries.filter((entry) => entry.id !== winner);
      while (remaining.length) {
        const index = Math.floor(wheelRandom() * remaining.length);
        const [loser] = remaining.splice(index, 1);
        await new Promise<void>((resolve) => {
          const timer = setTimeout(
            resolve,
            readAppearance().reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 1
              : 450,
          );
          this.watch(() => {
            clearTimeout(timer);
            resolve();
          });
        });
        if (this.destroyed || spinId !== this.#spinId) return;
        this.query(`[data-entry="${loser.id}"]`)?.classList.add('is-eliminated');
        const status = this.query('[data-spin-status]');
        if (status) status.textContent = `Выбывание: осталось ${remaining.length + 1}`;
      }
    }
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let start = 0;
    for (const entry of entries) {
      if (entry.id === winner) break;
      start += entry.weight;
    }
    const center =
      ((start + entries.find((entry) => entry.id === winner)!.weight / 2) / total) * 360;
    const end = this.#rotation + 360 * 5 + ((360 - center - (this.#rotation % 360) + 360) % 360);
    const duration =
      readAppearance().reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 1
        : this.#speed === 'fast'
          ? 1800
          : this.#speed === 'long'
            ? 6500
            : 3800;
    const rotor = this.find('.wheel-page__rotor');
    const animation = rotor.animate(
      [{ transform: `rotate(${this.#rotation}deg)` }, { transform: `rotate(${end}deg)` }],
      { duration, easing: 'cubic-bezier(.12,.7,.12,1)', fill: 'forwards' },
    );
    this.watch(() => animation.cancel());
    try {
      await animation.finished;
      if (this.destroyed || spinId !== this.#spinId) return;
      this.#rotation = end;
      rotor.style.transform = `rotate(${end}deg)`;
      animation.cancel();
      const result: WheelResult = {
        winner,
        entries,
        at: Date.now(),
        source:
          this.#sources().find((source) => source.value === this.#source)?.label || 'Личный список',
      };
      if (!rememberWheel(result))
        notify('Не удалось сохранить историю на устройстве.', { type: 'error' });
      this.#showWinner(result);
    } catch {
      if (!this.destroyed)
        notify('Не удалось завершить вращение. Попробуйте ещё раз.', { type: 'error' });
    } finally {
      if (!this.destroyed && spinId === this.#spinId) this.#setBusy(false);
    }
  }

  #showWinner(result: WheelResult) {
    const film = this.#films.find((item) => item.id === result.winner);
    if (!film) return;
    this.#winner?.close();
    this.#winner = new WheelWinner({
      film,
      result,
      films: this.#films,
      rating: this.#publicRatings.get(film.id)?.votes
        ? this.#publicRatings.get(film.id)!.average
        : null,
      replay: () => {
        void this.#spin();
      },
    }).open();
  }

  destroy() {
    this.#controller?.abort();
    this.#winner?.close();
    this.#share?.close();
    super.destroy();
  }
}
