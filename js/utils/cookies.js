export class CookieService {
  /**
   * Получить значение куки по имени
   * @param {string} name
   * @returns {string|null}
   */
  static get(name) {
    // Экранируем спецсимволы в имени для RegExp
    const matches = document.cookie.match(
      new RegExp(
        '(?:^|; )' +
          name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
          '=([^;]*)'
      )
    );
    
    return matches ? decodeURIComponent(matches[1]) : null;
  }

  /**
   * Установить куку
   * @param {string} name - Имя
   * @param {string|number|boolean} value - Значение
   * @param {Object} options - Дополнительные параметры (path, expires, max-age, secure, sameSite)
   */
  static set(name, value, options = {}) {
    options = {
      path: '/', // По умолчанию доступно на всем сайте
      ...options,
    };

    // Если передан Date в expires, переводим в UTC-строку
    if (options.expires instanceof Date) {
      options.expires = options.expires.toUTCString();
    }

    let updatedCookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    for (const [optionKey, optionValue] of Object.entries(options)) {
      updatedCookie += `; ${optionKey}`;
      
      if (optionValue !== true) {
        updatedCookie += `=${optionValue}`;
      }
    }

    document.cookie = updatedCookie;
  }

  /**
   * Удалить куку
   * @param {string} name
   * @param {Object} options - Опции (path/domain должны совпадать с теми, что были при установке)
   */
  static remove(name, options = {}) {
    this.set(name, '', {
      ...options,
      'max-age': -1, // Мгновенный сброс
    });
  }

  /**
   * Проверить существование куки
   * @param {string} name
   * @returns {boolean}
   */
  static has(name) {
    return this.get(name) !== null;
  }
}