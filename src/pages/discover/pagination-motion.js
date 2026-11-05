export const createPaginationMotion = ({
  page,
  feed,
  grid,
  pagination,
  getCurrentPage,
  render,
}) => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let version = 0;
  let requested = getCurrentPage();
  let animations = [];
  let stopScroll;
  const cancel = () => {
    version++;
    stopScroll?.();
    stopScroll = null;
    animations.forEach((animation) => animation.cancel());
    animations = [];
    grid.removeAttribute('aria-busy');
    pagination
      .querySelectorAll('[data-pending]')
      .forEach((button) => button.removeAttribute('data-pending'));
  };
  const scrollToFeed = () =>
    new Promise((resolve) => {
      const top = Math.max(0, scrollY + feed.getBoundingClientRect().top - 16);
      if (Math.abs(scrollY - top) < 4) {
        resolve();
        return;
      }
      let timeout;
      const finish = () => {
        clearTimeout(timeout);
        document.removeEventListener('scrollend', finish);
        if (stopScroll === abort) stopScroll = null;
        resolve();
      };
      const abort = () => {
        window.scrollTo({ top: scrollY, behavior: 'instant' });
        finish();
      };
      stopScroll = abort;
      document.addEventListener('scrollend', finish, { once: true });
      timeout = setTimeout(finish, 1000);
      window.scrollTo({ top, behavior: 'smooth' });
    });
  const change = async (target, trigger) => {
    if (target === requested) return;
    stopViewTransition();
    cancel();
    requested = target;
    const current = version;
    const direction = target > getCurrentPage() ? 1 : -1;
    const keyboard = trigger?.matches(':focus-visible');
    trigger?.setAttribute('data-pending', '');
    grid.setAttribute('aria-busy', 'true');
    const valid = () => current === version && page.isConnected;
    const apply = () => {
      render(target);
      [...grid.children].forEach((card) => {
        card.dataset.paginationCard = '';
        card.classList.remove('home-reveal-pending', 'home-revealed');
      });
      if (keyboard) {
        const heading = feed.querySelector('h2');
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    };
    try {
      if (motion.matches) {
        apply();
        feed.scrollIntoView({ block: 'start', behavior: 'instant' });
        return;
      }
      await scrollToFeed();
      if (!valid()) return;
      const list = grid.dataset.view === 'list';
      const leave = grid.animate(
        [
          { opacity: 1, transform: 'translate(0,0)' },
          { opacity: 0, transform: list ? `translateX(${-direction * 10}px)` : 'translateY(-5px)' },
        ],
        { duration: 120, easing: 'ease-out', fill: 'forwards' },
      );
      animations = [leave];
      await leave.finished.catch(() => {});
      if (!valid()) return;
      leave.cancel();
      apply();
      const columns = list
        ? 1
        : Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length);
      animations = [...grid.children]
        .filter((card) => {
          const rect = card.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < innerHeight + 80;
        })
        .map((card, index) =>
          card.animate(
            [
              {
                opacity: 0,
                transform: list
                  ? `translateX(${direction * 22}px)`
                  : 'translateY(16px) scale(.985)',
              },
              { opacity: 1, transform: 'translate(0,0) scale(1)' },
            ],
            {
              duration: list ? 320 : 400,
              delay: list
                ? Math.min(index * 32, 160)
                : Math.min(Math.floor(index / columns) * 38 + (index % columns) * 22, 180),
              easing: 'cubic-bezier(.2,.7,.2,1)',
              fill: 'both',
            },
          ),
        );
      await Promise.all(animations.map((animation) => animation.finished.catch(() => {})));
    } finally {
      if (valid()) {
        animations.forEach((animation) => animation.cancel());
        animations = [];
        grid.removeAttribute('aria-busy');
        trigger?.removeAttribute('data-pending');
      }
    }
  };
  const onMotionChange = () => {
    if (!motion.matches) return;
    const target = requested;
    cancel();
    if (page.isConnected && target !== getCurrentPage()) {
      render(target);
      [...grid.children].forEach((card) => {
        card.dataset.paginationCard = '';
      });
    }
  };
  const onViewChange = () => {
    const target = requested;
    cancel();
    if (page.isConnected && target !== getCurrentPage()) {
      render(target);
      [...grid.children].forEach((card) => {
        card.dataset.paginationCard = '';
      });
    }
  };
  grid.addEventListener('catalogviewchange', onViewChange);
  motion.addEventListener('change', onMotionChange);
  const observer = new MutationObserver(() => {
    if (page.isConnected) return;
    cancel();
    observer.disconnect();
    motion.removeEventListener('change', onMotionChange);
    grid.removeEventListener('catalogviewchange', onViewChange);
  });
  observer.observe(page.parentElement, { childList: true });
  return change;
};
import { stopViewTransition } from '../../services/view-transitions.js';
