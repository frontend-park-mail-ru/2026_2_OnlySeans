let stack;
const notices = new Map();
export const showNotice = (message, { type = 'info', action, duration = type === 'error' ? 8000 : 4000 } = {}) => {
  if (!stack?.isConnected) { stack = document.createElement('div');stack.className = 'toast-stack';stack.setAttribute('popover', 'manual');document.body.append(stack); }
  const owner = document.querySelector('dialog[open]') || document.body;
  if (stack.parentElement !== owner) {
    owner.append(stack);
    if (owner !== document.body) owner.addEventListener('close', () => { if (stack.parentElement !== owner) return;document.body.append(stack);if (stack.childElementCount) stack.showPopover(); }, { once: true });
  }
  const key = `${type}:${message}`;
  const existing = notices.get(key);if (existing?.node.isConnected) { clearTimeout(existing.timer);existing.timer = duration ? setTimeout(existing.close, duration) : null;if (!stack.matches(':popover-open')) stack.showPopover();return existing.close; }
  const node = document.createElement('section');node.className = `site-toast site-toast--${type}`;node.setAttribute('role', type === 'error' ? 'alert' : 'status');node.setAttribute('aria-atomic', 'true');
  const icon = document.createElement('span');icon.className = 'site-toast__icon';icon.setAttribute('aria-hidden', 'true');icon.textContent = type === 'error' ? '!' : type === 'success' ? '✓' : 'i';
  const copy = document.createElement('div');copy.className = 'site-toast__copy';const text = document.createElement('p');text.textContent = message;copy.append(text);
  const closeButton = document.createElement('button');closeButton.type = 'button';closeButton.className = 'site-toast__close';closeButton.setAttribute('aria-label', 'Закрыть уведомление');closeButton.textContent = '×';
  const entry = { node, timer: null, close: () => { clearTimeout(entry.timer);node.remove();notices.delete(key);if (!stack.childElementCount && stack.matches(':popover-open')) stack.hidePopover(); } };
  if (action) { const button = document.createElement(action.href ? 'a' : 'button');button.className = 'site-toast__action';button.textContent = action.label;if (action.href) { button.href = action.href;button.dataset.link = ''; }else button.type = 'button';button.addEventListener('click', () => { entry.close();action.onClick?.(); });copy.append(button); }
  closeButton.addEventListener('click', entry.close);node.append(icon, copy, closeButton);stack.append(node);notices.set(key, entry);
  if (stack.matches(':popover-open')) stack.hidePopover();stack.showPopover();entry.timer = duration ? setTimeout(entry.close, duration) : null;return entry.close;
};
