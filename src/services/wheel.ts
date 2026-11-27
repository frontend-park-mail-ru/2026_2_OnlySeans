import { store } from '../core/store.js';
import { readJson, writeJson } from './storage.js';

export interface WheelEntry {
  id: number;
  weight: number;
}
export interface WheelResult {
  winner: number;
  entries: WheelEntry[];
  at: number;
  source: string;
}

const historyKey = () => `frame:wheel-history:${store.get('user')?.id ?? 'guest'}`;

/** Проверяет данные истории и ссылок до использования в каталоге. */
export function validWheelEntries(value: unknown): WheelEntry[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 16) return [];
  const entries: WheelEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return [];
    const { id, weight } = item;
    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      !Number.isFinite(weight) ||
      weight < 1 ||
      weight > 100 ||
      entries.some((entry) => entry.id === id)
    )
      return [];
    entries.push({ id, weight });
  }
  return entries;
}

export function readWheelHistory(): WheelResult[] {
  const saved = readJson<unknown>(historyKey(), []);
  if (!Array.isArray(saved)) return [];
  return saved
    .filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        Number.isSafeInteger(item.winner) &&
        Number.isFinite(item.at) &&
        item.at > 0 &&
        typeof item.source === 'string' &&
        validWheelEntries(item.entries).some((entry) => entry.id === item.winner),
    )
    .slice(0, 50)
    .map((item) => ({
      winner: item.winner,
      entries: validWheelEntries(item.entries),
      at: item.at,
      source: item.source.slice(0, 80),
    }));
}

export function rememberWheel(result: WheelResult) {
  return writeJson(historyKey(), [result, ...readWheelHistory()].slice(0, 50));
}

/** Выбирает сектор пропорционально весу; random должен принадлежать [0, 1). */
export function pickWheel(entries: WheelEntry[], random: number): number {
  if (
    !entries.length ||
    !Number.isFinite(random) ||
    random < 0 ||
    random >= 1 ||
    entries.some((entry) => !Number.isFinite(entry.weight) || entry.weight <= 0)
  )
    throw new Error('Некорректные веса колеса.');
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (!Number.isFinite(total)) throw new Error('Сумма весов слишком велика.');
  let value = random * total;
  for (const entry of entries) {
    value -= entry.weight;
    if (value < 0) return entry.id;
  }
  return entries[entries.length - 1].id;
}

export function wheelRandom() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
}

export function wheelShare(result: WheelResult) {
  const url = new URL('/wheel', location.origin);
  url.searchParams.set(
    'choice',
    JSON.stringify({ winner: result.winner, entries: result.entries }),
  );
  return url.href;
}

export function readWheelShare(
  query: URLSearchParams,
): Pick<WheelResult, 'winner' | 'entries'> | null {
  const raw = query.get('choice');
  if (!raw || raw.length > 2000) return null;
  try {
    const value = JSON.parse(raw);
    const entries = validWheelEntries(value?.entries);
    return entries.some((entry) => entry.id === value?.winner)
      ? { winner: value.winner, entries }
      : null;
  } catch {
    return null;
  }
}
