import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { storage } from '../storage/storage';
import { Debt, PendingPayment, QueueOp, Sale, Shop } from '../types';
import { DebtAPI, SaleAPI, ServerDebt, ServerSale, ServerShop, ShopAPI } from '../api/client';
import { normalizePhone, uid } from '../utils/format';
import { hasAccess } from '../utils/access';
import { hashPin } from '../utils/hash';

type SaleInput = Pick<Sale, 'itemDescription' | 'amount' | 'paymentMethod' | 'customerName'>;
type DebtInput = Pick<Debt, 'customerName' | 'customerPhone' | 'item' | 'amount' | 'dueDate'>;
type ShopInput = Pick<Shop, 'shopName' | 'ownerName' | 'phone' | 'state' | 'marketName'>;

interface Ctx {
  ready: boolean;
  online: boolean;
  syncing: boolean;
  shop: Shop | null;
  sales: Sale[];
  debts: Debt[];
  pinLocked: boolean;
  access: boolean;
  pendingPayment: PendingPayment | null;
  justUnlocked: boolean;
  clearJustUnlocked: () => void;
  registerShop: (input: ShopInput) => Promise<{ existing: boolean }>;
  updateShop: (input: Partial<Omit<ShopInput, 'phone'>>) => Promise<void>;
  addSale: (input: SaleInput) => Promise<void>;
  updateSale: (localId: string, input: SaleInput) => Promise<void>;
  deleteSale: (localId: string) => Promise<void>;
  addDebt: (input: DebtInput) => Promise<void>;
  updateDebt: (localId: string, input: DebtInput) => Promise<void>;
  markDebtPaid: (localId: string) => Promise<void>;
  deleteDebt: (localId: string) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  checkPin: (pin: string) => Promise<boolean>;
  resetPin: (phone: string, shopName: string) => Promise<boolean>;
  setPendingPayment: (p: PendingPayment | null) => Promise<void>;
  refreshShop: () => Promise<void>;
  syncNow: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppCtx = createContext<Ctx | null>(null);

export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp must be inside AppProvider');
  return c;
};

const fromServerSale = (s: ServerSale): Sale => ({
  localId: s.clientId || s._id,
  serverId: s._id,
  itemDescription: s.itemDescription,
  amount: s.amount,
  paymentMethod: s.paymentMethod,
  customerName: s.customerName,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
  sync: 'synced',
});

const fromServerDebt = (d: ServerDebt): Debt => ({
  localId: d.clientId || d._id,
  serverId: d._id,
  customerName: d.customerName,
  customerPhone: d.customerPhone,
  item: d.item,
  amount: d.amount,
  dueDate: d.dueDate,
  status: d.status,
  paidAt: d.paidAt,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
  sync: 'synced',
});

const mergeServerShop = (local: Shop, s: ServerShop): Shop => ({
  ...local,
  serverId: s._id,
  shopName: local.sync === 'pending' ? local.shopName : s.shopName,
  ownerName: local.sync === 'pending' ? local.ownerName : s.ownerName,
  state: local.sync === 'pending' ? local.state : s.state,
  marketName: local.sync === 'pending' ? local.marketName : s.marketName,
  // Backend is the source of truth for trial + payment. This is what stops trial abuse.
  trialStartDate: s.trialStartDate,
  isPaid: s.isPaid,
  subscriptionEndDate: s.subscriptionEndDate ?? null,
  hasUsedLaunchOffer: s.hasUsedLaunchOffer,
  isLocked: !!s.isLocked,
});

const isNotFound = (e: unknown) => axios.isAxiosError(e) && e.response?.status === 404;
const isNetwork = (e: unknown) => axios.isAxiosError(e) && !e.response;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [shop, setShopState] = useState<Shop | null>(null);
  const [sales, setSalesState] = useState<Sale[]>([]);
  const [debts, setDebtsState] = useState<Debt[]>([]);
  const [pinLocked, setPinLocked] = useState(false);
  const [pendingPayment, setPendingPaymentState] = useState<PendingPayment | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const syncLock = useRef(false);
  const prevAccess = useRef<boolean | null>(null);

  // ---------- load ----------
  useEffect(() => {
    (async () => {
      const [s, sa, de, pp] = await Promise.all([
        storage.getShop(),
        storage.getSales(),
        storage.getDebts(),
        storage.getPendingPayment(),
      ]);
      setShopState(s);
      setSalesState(sa);
      setDebtsState(de);
      setPendingPaymentState(pp);
      setPinLocked(!!s?.pinHash);
      setReady(true);
    })();
  }, []);

  // Re-lock with PIN when app returns from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'background' && shop?.pinHash) setPinLocked(true);
      if (st === 'active') syncNow();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.pinHash]);

  // ---------- persistence helpers ----------
  const saveShop = async (s: Shop) => {
    setShopState(s);
    await storage.setShop(s);
  };
  const saveSales = async (list: Sale[]) => {
    setSalesState(list);
    await storage.setSales(list);
  };
  const saveDebts = async (list: Debt[]) => {
    setDebtsState(list);
    await storage.setDebts(list);
  };

  const enqueue = async (op: QueueOp) => {
    let q = await storage.getQueue();
    // collapse duplicate upserts of the same record
    if (op.kind === 'shop.upsert') q = q.filter((o) => o.kind !== 'shop.upsert');
    if (op.kind === 'sale.upsert') q = q.filter((o) => !(o.kind === 'sale.upsert' && o.localId === op.localId));
    if (op.kind === 'debt.upsert') q = q.filter((o) => !(o.kind === 'debt.upsert' && o.localId === op.localId));
    q.push(op);
    await storage.setQueue(q);
  };

  // ---------- sync engine ----------
  const pullAll = async (serverShopId: string) => {
    const [srvSales, srvDebts] = await Promise.all([SaleAPI.list(serverShopId), DebtAPI.list(serverShopId)]);
    const localSales = await storage.getSales();
    const localDebts = await storage.getDebts();
    const pendingSales = localSales.filter((x) => x.sync === 'pending');
    const pendingDebts = localDebts.filter((x) => x.sync === 'pending');
    const mergedSales = [
      ...pendingSales,
      ...srvSales.map(fromServerSale).filter((s) => !pendingSales.some((p) => p.localId === s.localId)),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const mergedDebts = [
      ...pendingDebts,
      ...srvDebts.map(fromServerDebt).filter((d) => !pendingDebts.some((p) => p.localId === d.localId)),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    await saveSales(mergedSales);
    await saveDebts(mergedDebts);
  };

  const syncNow = useCallback(async () => {
    if (syncLock.current) return;
    const net = await NetInfo.fetch();
    if (!net.isConnected) return;
    syncLock.current = true;
    setSyncing(true);
    try {
      let current = await storage.getShop();
      if (!current) return;
      let queue = await storage.getQueue();

      while (queue.length) {
        const op = queue[0];
        current = (await storage.getShop())!;
        try {
          if (op.kind === 'shop.upsert') {
            let srv: ServerShop;
            if (!current.serverId) {
              const res = await ShopAPI.register({
                shopName: current.shopName,
                ownerName: current.ownerName,
                phone: current.phone,
                state: current.state,
                marketName: current.marketName,
              });
              srv = res.shop;
            } else {
              srv = await ShopAPI.update(current.serverId, {
                shopName: current.shopName,
                ownerName: current.ownerName,
                state: current.state,
                marketName: current.marketName,
              });
            }
            await saveShop({ ...mergeServerShop({ ...current, sync: 'synced' }, srv), sync: 'synced' });
          } else {
            if (!current.serverId) break; // shop must exist on server first
            const shopId = current.serverId;
            if (op.kind === 'sale.upsert') {
              const list = await storage.getSales();
              const rec = list.find((s) => s.localId === op.localId);
              if (rec) {
                const body = {
                  shop: shopId,
                  clientId: rec.localId,
                  itemDescription: rec.itemDescription,
                  amount: rec.amount,
                  paymentMethod: rec.paymentMethod,
                  customerName: rec.customerName || undefined,
                };
                const srv = rec.serverId ? await SaleAPI.update(rec.serverId, body) : await SaleAPI.create(body);
                const fresh = await storage.getSales();
                await saveSales(fresh.map((s) => (s.localId === rec.localId ? { ...s, serverId: srv._id, sync: 'synced' } : s)));
              }
            } else if (op.kind === 'debt.upsert') {
              const list = await storage.getDebts();
              const rec = list.find((d) => d.localId === op.localId);
              if (rec) {
                const body = {
                  shop: shopId,
                  clientId: rec.localId,
                  customerName: rec.customerName,
                  customerPhone: rec.customerPhone,
                  item: rec.item,
                  amount: rec.amount,
                  dueDate: rec.dueDate,
                  status: rec.status,
                  paidAt: rec.paidAt ?? null,
                };
                const srv = rec.serverId ? await DebtAPI.update(rec.serverId, body) : await DebtAPI.create(body);
                const fresh = await storage.getDebts();
                await saveDebts(fresh.map((d) => (d.localId === rec.localId ? { ...d, serverId: srv._id, sync: 'synced' } : d)));
              }
            } else if (op.kind === 'sale.delete' && op.serverId) {
              await SaleAPI.remove(op.serverId).catch((e) => {
                if (!isNotFound(e)) throw e;
              });
            } else if (op.kind === 'debt.delete' && op.serverId) {
              await DebtAPI.remove(op.serverId).catch((e) => {
                if (!isNotFound(e)) throw e;
              });
            }
          }
        } catch (e) {
          if (isNetwork(e)) break; // try again later
          console.warn('Sync op failed, dropping', op.kind, e);
        }
        queue = (await storage.getQueue()).filter((o) => o.id !== op.id);
        await storage.setQueue(queue);
      }

      // Pull fresh shop (payment status) + data
      current = (await storage.getShop())!;
      if (current?.serverId) {
        try {
          const srv = await ShopAPI.getByPhone(current.phone);
          await saveShop(mergeServerShop(current, srv));
          if ((await storage.getQueue()).length === 0) await pullAll(srv._id);
        } catch (e) {
          if (!isNetwork(e)) console.warn('Refresh failed', e);
        }
      }
    } finally {
      syncLock.current = false;
      setSyncing(false);
    }
  }, []);

  // online listener
  useEffect(() => {
    const unsub = NetInfo.addEventListener((st) => {
      const isOn = !!st.isConnected;
      setOnline(isOn);
      if (isOn) syncNow();
    });
    const t = setInterval(() => syncNow(), 60_000);
    return () => {
      unsub();
      clearInterval(t);
    };
  }, [syncNow]);

  // detect unlock (from locked -> paid) to show success screen
  const access = shop ? hasAccess(shop) : false;
  useEffect(() => {
    if (!shop) return;
    if (prevAccess.current === false && access && shop.isPaid) {
      setJustUnlocked(true);
      storage.setPendingPayment(null);
      setPendingPaymentState(null);
    }
    prevAccess.current = access;
  }, [access, shop]);

  // ---------- actions ----------
  const registerShop: Ctx['registerShop'] = async (input) => {
    const phone = normalizePhone(input.phone);
    const base: Shop = {
      localId: uid(),
      ...input,
      phone,
      trialStartDate: new Date().toISOString(),
      isPaid: false,
      subscriptionEndDate: null,
      hasUsedLaunchOffer: false,
      pinHash: null,
      sync: 'pending',
    };
    // Try online first so a returning phone gets its ORIGINAL trial date (no new trial).
    try {
      const res = await ShopAPI.register({ ...input, phone });
      const merged = mergeServerShop({ ...base, sync: 'synced' }, res.shop);
      await saveShop(merged);
      if (res.existing) await pullAll(res.shop._id).catch(() => {});
      return { existing: res.existing };
    } catch (e) {
      if (!isNetwork(e)) throw e;
      await saveShop(base);
      await enqueue({ id: uid(), kind: 'shop.upsert' });
      return { existing: false };
    }
  };

  const updateShop: Ctx['updateShop'] = async (input) => {
    if (!shop) return;
    await saveShop({ ...shop, ...input, sync: 'pending' });
    await enqueue({ id: uid(), kind: 'shop.upsert' });
    syncNow();
  };

  const addSale: Ctx['addSale'] = async (input) => {
    const now = new Date().toISOString();
    const sale: Sale = { localId: uid(), ...input, createdAt: now, updatedAt: now, sync: 'pending' };
    await saveSales([sale, ...(await storage.getSales())]);
    await enqueue({ id: uid(), kind: 'sale.upsert', localId: sale.localId });
    syncNow();
  };

  const updateSale: Ctx['updateSale'] = async (localId, input) => {
    const list = await storage.getSales();
    await saveSales(list.map((s) => (s.localId === localId ? { ...s, ...input, updatedAt: new Date().toISOString(), sync: 'pending' } : s)));
    await enqueue({ id: uid(), kind: 'sale.upsert', localId });
    syncNow();
  };

  const deleteSale: Ctx['deleteSale'] = async (localId) => {
    const list = await storage.getSales();
    const rec = list.find((s) => s.localId === localId);
    await saveSales(list.filter((s) => s.localId !== localId));
    const q = (await storage.getQueue()).filter((o) => !(o.kind === 'sale.upsert' && o.localId === localId));
    await storage.setQueue(q);
    if (rec?.serverId) await enqueue({ id: uid(), kind: 'sale.delete', localId, serverId: rec.serverId });
    syncNow();
  };

  const addDebt: Ctx['addDebt'] = async (input) => {
    const now = new Date().toISOString();
    const debt: Debt = { localId: uid(), ...input, status: 'owing', paidAt: null, createdAt: now, updatedAt: now, sync: 'pending' };
    await saveDebts([debt, ...(await storage.getDebts())]);
    await enqueue({ id: uid(), kind: 'debt.upsert', localId: debt.localId });
    syncNow();
  };

  const patchDebt = async (localId: string, patch: Partial<Debt>) => {
    const list = await storage.getDebts();
    await saveDebts(list.map((d) => (d.localId === localId ? { ...d, ...patch, updatedAt: new Date().toISOString(), sync: 'pending' } : d)));
    await enqueue({ id: uid(), kind: 'debt.upsert', localId });
    syncNow();
  };

  const updateDebt: Ctx['updateDebt'] = (localId, input) => patchDebt(localId, input);
  const markDebtPaid: Ctx['markDebtPaid'] = (localId) =>
    patchDebt(localId, { status: 'paid', paidAt: new Date().toISOString() });

  const deleteDebt: Ctx['deleteDebt'] = async (localId) => {
    const list = await storage.getDebts();
    const rec = list.find((d) => d.localId === localId);
    await saveDebts(list.filter((d) => d.localId !== localId));
    const q = (await storage.getQueue()).filter((o) => !(o.kind === 'debt.upsert' && o.localId === localId));
    await storage.setQueue(q);
    if (rec?.serverId) await enqueue({ id: uid(), kind: 'debt.delete', localId, serverId: rec.serverId });
    syncNow();
  };

  const setPin: Ctx['setPin'] = async (pin) => {
    if (!shop) return;
    const pinHash = await hashPin(pin, shop.phone);
    await saveShop({ ...shop, pinHash });
    if (shop.serverId) ShopAPI.update(shop.serverId, { pin }).catch(() => {});
  };

  const removePin: Ctx['removePin'] = async () => {
    if (!shop) return;
    await saveShop({ ...shop, pinHash: null });
    setPinLocked(false);
    if (shop.serverId) ShopAPI.update(shop.serverId, { pin: null }).catch(() => {});
  };

  const checkPin: Ctx['checkPin'] = async (pin) => {
    if (!shop?.pinHash) return true;
    const ok = (await hashPin(pin, shop.phone)) === shop.pinHash;
    if (ok) setPinLocked(false);
    return ok;
  };

  const resetPin: Ctx['resetPin'] = async (phone, shopName) => {
    if (!shop) return false;
    const match =
      normalizePhone(phone) === shop.phone && shopName.trim().toLowerCase() === shop.shopName.trim().toLowerCase();
    if (!match) return false;
    if (shop.serverId) ShopAPI.resetPin(shop.phone, shop.shopName).catch(() => {});
    await saveShop({ ...shop, pinHash: null });
    setPinLocked(false);
    return true;
  };

  const setPendingPayment: Ctx['setPendingPayment'] = async (p) => {
    setPendingPaymentState(p);
    await storage.setPendingPayment(p);
  };

  const refreshShop = async () => {
    await syncNow();
  };

  const logout = async () => {
    await syncNow();
    await storage.clearAll();
    setShopState(null);
    setSalesState([]);
    setDebtsState([]);
    setPendingPaymentState(null);
    setPinLocked(false);
    prevAccess.current = null;
  };

  const value = useMemo<Ctx>(
    () => ({
      ready,
      online,
      syncing,
      shop,
      sales,
      debts,
      pinLocked,
      access,
      pendingPayment,
      justUnlocked,
      clearJustUnlocked: () => setJustUnlocked(false),
      registerShop,
      updateShop,
      addSale,
      updateSale,
      deleteSale,
      addDebt,
      updateDebt,
      markDebtPaid,
      deleteDebt,
      setPin,
      removePin,
      checkPin,
      resetPin,
      setPendingPayment,
      refreshShop,
      syncNow,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, online, syncing, shop, sales, debts, pinLocked, access, pendingPayment, justUnlocked]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
