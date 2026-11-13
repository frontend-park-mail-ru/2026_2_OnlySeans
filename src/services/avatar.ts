import { getMyAvatar, uploadAvatar } from '../api/profile.js';
import { assetUrl } from '../api/http.js';
import { store } from '../core/store.js';

let generation = 0;

async function refreshAvatar() {
  const visit = ++generation;
  const { url } = await getMyAvatar();
  if (visit === generation) store.set({ avatarUrl: assetUrl(url) });
}

let accountId;
store.watch('user', (user) => {
  if (user?.id === accountId) return;
  accountId = user?.id;
  generation += 1;
  store.set({ avatarUrl: '' });
  if (user) void refreshAvatar().catch(() => {});
});

export async function saveAvatar(file) {
  const visit = generation;
  await uploadAvatar(file);
  if (visit === generation) await refreshAvatar();
}
