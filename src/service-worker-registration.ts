declare const __SW_ENABLED__: boolean;

if (__SW_ENABLED__ && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', {
      scope: '/', updateViaCache: 'none',
    }).catch(error => console.warn('Не удалось зарегистрировать service worker:', error));
  }, { once: true });
}
