export interface Account {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

const ACCOUNT_KEY = 'frame:offline:account';
const PRIVATE_PREFIX = 'frame:offline:private:';

export function readOffline<T>(key: string): T | undefined {
  try {
    const value = localStorage.getItem(key);
    return value === null ? undefined : JSON.parse(value);
  } catch {
    return undefined;
  }
}

export function writeOffline(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeOffline(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    return;
  }
}

export function offlineAccount(): Account | null {
  return readOffline<Account>(ACCOUNT_KEY) ?? null;
}

export function saveOfflineAccount(account: Account | null) {
  const previous = offlineAccount();
  if (!account || previous?.id !== account.id) {
    for (const key of offlineKeys(PRIVATE_PREFIX)) removeOffline(key);
  }
  if (account) {
    const { id, username, email, created_at } = account;
    writeOffline(ACCOUNT_KEY, { id, username, email, created_at });
  } else {
    removeOffline(ACCOUNT_KEY);
  }
}

export const privateKey = (accountId: number, name: string) => PRIVATE_PREFIX + accountId + ':' + name;

export function offlineKeys(prefix: string): string[] {
  try {
    return Object.keys(localStorage).filter(key => key.startsWith(prefix));
  } catch {
    return [];
  }
}
