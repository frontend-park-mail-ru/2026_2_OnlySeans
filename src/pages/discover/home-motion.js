// Observe new cards too: filters and saved-film updates replace their contents.
export const observeHomeEntrances = page => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new WeakSet();
  const selector = '.watch-later, .home-collections, .catalog-feed, .collection-card, .catalog-feed .movie-tile-shell';
  const reveal = node => { node.classList.remove('home-reveal-pending');if (!node.hasAttribute('data-layout-card')) node.classList.add('home-revealed'); };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) { reveal(entry.target);observer.unobserve(entry.target); }
  }, { threshold: .06 });
  const scan = () => {
    page.querySelectorAll(selector).forEach(node => {
      if (seen.has(node)) return;
      seen.add(node);
      if (node.hasAttribute('data-pagination-card') || node.hasAttribute('data-layout-card')) return;
      if (motion.matches || node.getBoundingClientRect().top < innerHeight) return;
      node.classList.add('home-reveal-pending');observer.observe(node);
    });
  };
  const onMotionChange = () => { if (motion.matches) { page.querySelectorAll('.home-reveal-pending').forEach(reveal);observer.disconnect(); } };
  const mutations = new MutationObserver(scan);
  mutations.observe(page, { childList: true, subtree: true });
  motion.addEventListener('change', onMotionChange);
  // Only watch the direct parent for navigation, avoiding a perpetual timer.
  const disposal = new MutationObserver(() => {
    if (page.isConnected) return;
    observer.disconnect();mutations.disconnect();disposal.disconnect();motion.removeEventListener('change', onMotionChange);
  });
  disposal.observe(page.parentElement, { childList: true });
  scan();
};
