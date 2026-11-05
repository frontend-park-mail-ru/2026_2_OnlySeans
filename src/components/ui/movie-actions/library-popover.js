export const mountLibraryPopover = (popover, origin, page, movieId) => {
  const heroAnchor = origin?.closest('.spotlight-actions');
  let disposed = false;
  const cleanup = (restoreFocus) => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('resize', position);
    window.removeEventListener('scroll', position, true);
    window.visualViewport?.removeEventListener('resize', position);
    window.visualViewport?.removeEventListener('scroll', position);
    resizeObserver.disconnect();
    observer.disconnect();
    origin?.setAttribute('aria-expanded', 'false');
    origin?.removeAttribute('aria-controls');
    popover.remove();
    if (restoreFocus && page.isConnected) {
      const target = origin?.isConnected
        ? origin
        : page.querySelector(`[data-library-movie-id="${movieId}"]`) ||
          heroAnchor?.querySelector('[data-library-movie-id]') ||
          page.querySelector('main h1, main h2');
      if (target) {
        if (!target.matches('button,a,input')) target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    }
  };
  const close = (restoreFocus = true) => {
    if (popover.matches(':popover-open')) popover.hidePopover();
    cleanup(restoreFocus);
  };
  const position = () => {
    if (!page.isConnected) {
      close(false);
      return;
    }
    // меню крепится к кнопке, которая его открыла, а если её уже нет — к кнопке фильма
    let anchor = page.querySelector(`[data-library-movie-id="${movieId}"]`);
    if (heroAnchor?.isConnected) anchor = heroAnchor;
    if (origin?.isConnected) anchor = origin;
    if (!anchor) {
      close(false);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0;
    const top = viewport?.offsetTop || 0;
    const width = viewport?.width || innerWidth;
    const height = viewport?.height || innerHeight;
    popover.style.maxHeight = `${Math.max(100, height - 16)}px`;
    const popoverWidth = popover.offsetWidth;
    const popoverHeight = popover.offsetHeight;
    const fitsRight = rect.right + 10 + popoverWidth <= left + width - 8;
    const fitsLeft = rect.left - 10 - popoverWidth >= left + 8;
    let x = rect.right - popoverWidth;
    if (fitsRight) x = rect.right + 10;
    else if (fitsLeft) x = rect.left - 10 - popoverWidth;
    popover.style.left = `${Math.max(left + 8, Math.min(x, left + width - popoverWidth - 8))}px`;
    popover.style.top = `${Math.max(top + 8, Math.min(rect.top, top + height - popoverHeight - 8))}px`;
  };
  const resizeObserver = new ResizeObserver(position);
  const observer = new MutationObserver(position);
  popover.dismiss = () => close(false);
  popover.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });
  popover.addEventListener('toggle', () => {
    if (!popover.matches(':popover-open')) cleanup(false);
  });
  page.append(popover);
  popover.showPopover();
  origin?.setAttribute('aria-expanded', 'true');
  origin?.setAttribute('aria-controls', popover.id);
  position();
  resizeObserver.observe(popover);
  observer.observe(document.getElementById('app'), { childList: true, subtree: true });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, true);
  window.visualViewport?.addEventListener('resize', position);
  window.visualViewport?.addEventListener('scroll', position);
  popover.querySelector('.personal-library-close').focus({ preventScroll: true });
  return close;
};
