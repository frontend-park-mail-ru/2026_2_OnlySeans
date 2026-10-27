export const mountLibraryPopover = (popover, origin, page, movieId) => {
  const heroAnchor = origin?.closest('.spotlight-actions');
  let disposed = false;
  const cleanup = restoreFocus => {
    if (disposed) return;disposed = true;
    window.removeEventListener('resize', position);window.removeEventListener('scroll', position, true);
    window.visualViewport?.removeEventListener('resize', position);window.visualViewport?.removeEventListener('scroll', position);
    resizeObserver.disconnect();observer.disconnect();
    origin?.setAttribute('aria-expanded', 'false');origin?.removeAttribute('aria-controls');popover.remove();
    if (restoreFocus && page.isConnected) {
      const target = origin?.isConnected ? origin : page.querySelector(`[data-library-movie-id="${movieId}"]`) || heroAnchor?.querySelector('[data-library-movie-id]') || page.querySelector('main h1, main h2');
      if (target) { if (!target.matches('button,a,input')) target.tabIndex = -1;target.focus({ preventScroll: true }); }
    }
  };
  const close = (restoreFocus = true) => { if (popover.matches(':popover-open')) popover.hidePopover();cleanup(restoreFocus); };
  const position = () => {
    if (!page.isConnected) { close(false);return; }
    const anchor = origin?.isConnected ? origin : heroAnchor?.isConnected ? heroAnchor : page.querySelector(`[data-library-movie-id="${movieId}"]`);
    if (!anchor) { close(false);return; }
    const rect = anchor.getBoundingClientRect(), viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0, width = viewport?.width || innerWidth, height = viewport?.height || innerHeight;
    popover.style.maxHeight = `${Math.max(100, height - 16)}px`;
    const w = popover.offsetWidth, h = popover.offsetHeight;
    const x = rect.right + 10 + w <= left + width - 8 ? rect.right + 10 : rect.left - 10 - w >= left + 8 ? rect.left - 10 - w : rect.right - w;
    popover.style.left = `${Math.max(left + 8, Math.min(x, left + width - w - 8))}px`;
    popover.style.top = `${Math.max(top + 8, Math.min(rect.top, top + height - h - 8))}px`;
  };
  const resizeObserver = new ResizeObserver(position), observer = new MutationObserver(position);
  popover.dismiss = () => close(false);
  popover.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault();close(); } });
  popover.addEventListener('toggle', () => { if (!popover.matches(':popover-open')) cleanup(false); });
  page.append(popover);popover.showPopover();origin?.setAttribute('aria-expanded', 'true');origin?.setAttribute('aria-controls', popover.id);
  position();resizeObserver.observe(popover);observer.observe(document.getElementById('app'), { childList: true, subtree: true });
  window.addEventListener('resize', position);window.addEventListener('scroll', position, true);
  window.visualViewport?.addEventListener('resize', position);window.visualViewport?.addEventListener('scroll', position);
  popover.querySelector('.personal-library-close').focus({ preventScroll: true });
  return close;
};
