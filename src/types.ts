export type SyncState = 'synced' | 'pending';

export interface Shop {
  localId: string;
  serverId?: string;
  shopName: string;
  ownerName: string;
  phone: string;
  state: string;
  marketName: string;
  trialStartDate: string; // ISO
  isPaid: boolean;
  subscriptionEndDate?: string | null;
  hasUsedLaunchOffer?: boolean;
  isLocked?: boolean; // set by admin "Lock User"
  pinHash?: string | null; // local SHA-256 hash of PIN
  sync: SyncState;
}

export interface Sale {
  localId: string;
  serverId?: string;
  itemDescription: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer';
  customerName?: string;
  createdAt: string;
  updatedAt: string;
  sync: SyncState;
}

export interface Debt {
  localId: string;
  serverId?: string;
  customerName: string;
  customerPhone: string;
  item: string;
  amount: number;
  dueDate: string; // ISO date
  status: 'owing' | 'paid';
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sync: SyncState;
}

export type QueueOp =
  | { id: string; kind: 'shop.upsert' }
  | { id: string; kind: 'sale.upsert'; localId: string }
  | { id: string; kind: 'sale.delete'; localId: string; serverId?: string }
  | { id: string; kind: 'debt.upsert'; localId: string }
  | { id: string; kind: 'debt.delete'; localId: string; serverId?: string };

export interface PendingPayment {
  id: string;
  plan: 'monthly' | 'launch' | 'yearly';
  amount: number;
  createdAt: string;
}
