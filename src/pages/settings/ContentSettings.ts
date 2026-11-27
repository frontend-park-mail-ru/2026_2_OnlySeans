import templateSource from './ContentSettings.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import {
  readCatalogView,
  readContentPreferences,
  saveContentPreferences,
  type ContentPreferences,
} from '../../services/content-preferences.js';
import { StorageKey, writeJson } from '../../services/storage.js';
import { CATALOG_SORTS } from '../../services/catalog-filters.js';
import { notify } from '../../services/notice.js';

const template = await loadAssets({ template: templateSource });

/** Настройки контента используются карточками, отзывами и каталогом. */
export class ContentSettings extends Component {
  static template = template;

  context() {
    return {
      titles: [
        { value: 'russian', label: 'Русские' },
        { value: 'original', label: 'Оригинальные' },
        { value: 'both', label: 'Оба' },
      ],
      views: [
        { value: 'grid', label: 'Сетка' },
        { value: 'list', label: 'Список' },
      ],
      sorts: CATALOG_SORTS,
    };
  }

  onRender() {
    const value = readContentPreferences();
    this.find<HTMLInputElement>('[name=hideSpoilers]').checked = value.hideSpoilers;
    this.find<HTMLInputElement>('[name=hideWatchedRecommendations]').checked =
      value.hideWatchedRecommendations;
    this.find<HTMLInputElement>('[name=hideAdults]').checked = value.hideAdults;
    this.find<HTMLInputElement>(`[name=titles][value=${value.titles}]`).checked = true;
    this.find<HTMLInputElement>(`[name=view][value=${readCatalogView()}]`).checked = true;
    this.find<HTMLSelectElement>('[name=sort]').value = value.sort;
    this.on('change', (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;
      let saved = true;
      if (input.name === 'hideSpoilers' && input instanceof HTMLInputElement)
        saved = saveContentPreferences({ hideSpoilers: input.checked });
      if (input.name === 'hideWatchedRecommendations' && input instanceof HTMLInputElement)
        saved = saveContentPreferences({ hideWatchedRecommendations: input.checked });
      if (input.name === 'hideAdults' && input instanceof HTMLInputElement)
        saved = saveContentPreferences({ hideAdults: input.checked });
      if (input.name === 'titles')
        saved = saveContentPreferences({ titles: input.value as ContentPreferences['titles'] });
      if (input.name === 'view')
        saved = writeJson(StorageKey.CATALOG_VIEW, input.value === 'list' ? 'list' : 'grid');
      if (input.name === 'sort')
        saved = saveContentPreferences({
          sort: CATALOG_SORTS.find((sort) => sort.value === input.value)?.value ?? 'catalog',
        });
      if (!saved) notify('Не удалось сохранить настройки на устройстве.', { type: 'error' });
    });
  }
}
