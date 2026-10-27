const KEY = '__frameHistoryIndex';
export class NavigationHistory {
  constructor(history, referrer = '', origin = '') {
    this.history = history;
    if (!Number.isSafeInteger(history.state?.[KEY]) || history.state[KEY] < 0) {
      let previous = false;
      try { previous = Boolean(referrer && new URL(referrer).origin === origin && history.length > 1); } catch { /* An invalid referrer cannot establish an in-app history entry. */ }
      history.replaceState({ ...history.state, [KEY]: previous ? 1 : 0 }, '');
    }
  }
  canGoBack() { return Number.isSafeInteger(this.history.state?.[KEY]) && this.history.state[KEY] > 0; }
  push(path) {
    this.history.pushState({ [KEY]: (this.history.state?.[KEY] || 0) + 1 }, '', path);
  }
  back() { if (this.canGoBack()) this.history.back(); }
}
