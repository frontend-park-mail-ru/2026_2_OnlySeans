import './settings-page.css';
import templateSource from './SettingsPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import type { PageProps } from '../../app/router.js';
import { AppearanceSettings } from './AppearanceSettings.js';
import { ContentSettings } from './ContentSettings.js';
import { SettingsExtra } from './SettingsExtra.js';
import { store } from '../../core/store.js';
import { arrive } from '../../services/page-transition.js';

const template = await loadAssets({ template: templateSource });
const SECTIONS = [
  { id: 'appearance', label: 'Внешний вид' },
  { id: 'notifications', label: 'Уведомления' },
  { id: 'content', label: 'Контент и отображение' },
  { id: 'region', label: 'Регион и покупки' },
  { id: 'map', label: 'Карта съёмок' },
];
const sectionId = (props: PageProps) =>
  SECTIONS.find((section) => section.id === props.query.get('section'))?.id || 'appearance';

/** Шапка и навигация настроек сохраняются при смене вкладки и возврате по истории. */
export class SettingsPage extends Component<PageProps> {
  static template = template;
  #section = '';
  #panel: Component | null = null;
  context() {
    return {
      backHref: store.get('user') ? '/profile' : '/',
      sections: SECTIONS.map((section) => ({
        ...section,
        icon: String(
          new URL(`../../assets/images/settings/settings-${section.id}.svg`, import.meta.url),
        ),
        href: `/settings?section=${section.id}`,
        enabled: true,
        current: section.id === sectionId(this.props) ? 'page' : 'false',
      })),
    };
  }
  onRender() {
    document.title = 'Настройки | Frame';
    this.#panel = null;
    this.#section = '';
    this.insert('heading', new SectionHeading({ title: 'Настройки', level: 1 }));
    this.updateRoute(this.props);
    const observer = new ResizeObserver(() => this.#revealSection());
    const nav = this.find('.settings-page__sections');
    observer.observe(nav);
    this.findAll('.settings-page__section').forEach((link) => observer.observe(link));
    this.watch(() => observer.disconnect());
  }
  updateRoute(props: PageProps) {
    this.props = props;
    const section = sectionId(props);
    if (section === this.#section) return;
    this.#section = section;
    const panel =
      section === 'appearance'
        ? new AppearanceSettings()
        : section === 'content'
          ? new ContentSettings()
          : new SettingsExtra({ section });
    this.#panel = this.#panel ? this.swap(this.#panel, panel) : this.insert('panel', panel);
    this.findAll<HTMLAnchorElement>('.settings-page__section').forEach((link) => {
      link.setAttribute(
        'aria-current',
        new URL(link.getAttribute('href') || '/settings', location.href).searchParams.get(
          'section',
        ) === section
          ? 'page'
          : 'false',
      );
    });
    const frame = requestAnimationFrame(() => {
      if (this.destroyed || this.#panel !== panel) return;
      arrive(panel.element, { duration: 240, rise: false });
      this.#revealSection();
    });
    this.watch(() => cancelAnimationFrame(frame));
  }

  #revealSection() {
    const nav = this.query('.settings-page__sections');
    const active = this.query('.settings-page__section[aria-current="page"]');
    if (!nav || !active) return;
    const container = nav.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.left < container.left) nav.scrollLeft -= container.left - item.left + 8;
    else if (item.right > container.right) nav.scrollLeft += item.right - container.right + 8;
  }
}
