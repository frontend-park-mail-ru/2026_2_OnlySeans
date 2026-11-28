export const homeBlocksKey = 'frontend.home_blocks';
export const homeBlocksFlag = 'frontend.home_blocks_enabled';

export type HomeBlock =
  | { type: 'banner'; title: string; text?: string; action?: { label: string; href: string } }
  | { type: 'collection'; id: number };

export const homeBlocksExample: HomeBlock[] = [
  { type: 'banner', title: 'Что посмотреть вечером', text: 'Выберите фильм из подборок Frame.',
    action: { label: 'Открыть подборки', href: '/collections' } },
  { type: 'collection', id: 1 },
];

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, max: number) {
  return typeof value === 'string' && value.trim() && value.trim().length <= max
    ? value.trim() : undefined;
}

function localPath(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/') || /^\/\/|[\\\s\p{Cc}]/u.test(value)) return;
  const origin = 'https://frame.invalid';
  const url = new URL(value, origin);
  if (url.origin === origin && !url.pathname.startsWith('//') && !/^\/onlineconf(?:\/|$)/.test(url.pathname)) {
    return url.pathname + url.search + url.hash;
  }
}

export function parseHomeBlocks(value: unknown): HomeBlock[] {
  if (!Array.isArray(value) || value.length > 6) throw new Error('Укажите массив из 0–6 блоков.');
  return value.map((block, index) => {
    const fail = (hint: string): never => { throw new Error(`Блок ${index + 1}: ${hint}`); };
    if (!record(block)) return fail('ожидается объект.');
    if (block.type === 'collection') {
      const id = block.id;
      if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return fail('укажите целый положительный ID подборки.');
      return { type: 'collection', id };
    }
    if (block.type !== 'banner') return fail('укажите тип banner или collection.');
    const title = text(block.title, 100);
    if (!title) return fail('укажите заголовок до 100 символов.');
    const body = block.text === undefined ? undefined : text(block.text, 300);
    if (block.text !== undefined && !body) return fail('текст должен быть от 1 до 300 символов.');
    const result: HomeBlock = { type: 'banner', title, text: body };
    if (block.action !== undefined) {
      const action = block.action;
      if (!record(action)) return fail('укажите кнопку объектом action.');
      const label = text(action.label, 40);
      const href = localPath(action.href);
      if (!label || !href) return fail('для кнопки нужны подпись до 40 символов и внутренний адрес, например /collections.');
      result.action = { label, href };
    }
    return result;
  });
}
