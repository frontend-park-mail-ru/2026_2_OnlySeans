export const collectionShareUrl = item => {
  const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, name: item.name, filmIds: item.filmIds }));
  const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  return `${location.origin}/collections#shared=${encoded}`;
};

export const readSharedCollection = hash => {
  const encoded = new URLSearchParams(hash.slice(1)).get('shared');
  if (encoded === null) return null;
  try {
    if (!/^[a-zA-Z0-9_-]+$/.test(encoded) || encoded.length > 16000) throw new Error();
    const bytes = Uint8Array.from(atob(encoded.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0));
    const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (data.v !== 1 || typeof data.name !== 'string' || !data.name.trim() || data.name.length > 80 || !Array.isArray(data.filmIds) || data.filmIds.length > 1000 || data.filmIds.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new Error();
    return { name: data.name, filmIds: [...new Set(data.filmIds)] };
  } catch { throw new Error('Ссылка на коллекцию повреждена. Попросите отправить её ещё раз.'); }
};
