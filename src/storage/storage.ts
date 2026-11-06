import AsyncStorage from '@react-native-async-storage/async-storage';
import { Debt, PendingPayment, QueueOp, Sale, Shop } from '../types';

const K = {
  shop: 'sb.shop',
  sales: 'sb.sales',
  debts: 'sb.debts',
  queue: 'sb.queue',
  pendingPayment: 'sb.pendingPayment',
  markets: 'sb.markets', // cached markets per state
};

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const write = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value));

export const storage = {
  getShop: () => read<Shop | null>(K.shop, null),
  setShop: (s: Shop) => write(K.shop, s),

  getSales: () => read<Sale[]>(K.sales, []),
  setSales: (s: Sale[]) => write(K.sales, s),

  getDebts: () => read<Debt[]>(K.debts, []),
  setDebts: (d: Debt[]) => write(K.debts, d),

  getQueue: () => read<QueueOp[]>(K.queue, []),
  setQueue: (q: QueueOp[]) => write(K.queue, q),

  getPendingPayment: () => read<PendingPayment | null>(K.pendingPayment, null),
  setPendingPayment: (p: PendingPayment | null) =>
    p ? write(K.pendingPayment, p) : AsyncStorage.removeItem(K.pendingPayment),

  getCachedMarkets: () => read<Record<string, string[]>>(K.markets, {}),
  setCachedMarkets: (m: Record<string, string[]>) => write(K.markets, m),

  clearAll: () => AsyncStorage.multiRemove(Object.values(K)),
};
