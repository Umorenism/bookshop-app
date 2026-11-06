import axios from 'axios';
import { API_URL } from '../config';

export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 15000 });

export const errorMessage = (e: unknown): string => {
  if (axios.isAxiosError(e)) {
    if (!e.response) return 'No internet. We will try again when you are online.';
    return (e.response.data as any)?.message || 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
};

export interface ServerShop {
  _id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  state: string;
  marketName: string;
  trialStartDate: string;
  isPaid: boolean;
  subscriptionEndDate?: string | null;
  hasUsedLaunchOffer: boolean;
  hasPin?: boolean;
  isLocked?: boolean;
}

export interface ServerSale {
  _id: string;
  clientId?: string;
  itemDescription: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer';
  customerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServerDebt {
  _id: string;
  clientId?: string;
  customerName: string;
  customerPhone: string;
  item: string;
  amount: number;
  dueDate: string;
  status: 'owing' | 'paid';
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ShopAPI = {
  register: (body: { shopName: string; ownerName: string; phone: string; state: string; marketName: string }) =>
    api.post<{ shop: ServerShop; existing: boolean }>('/shops/register', body).then((r) => r.data),
  getByPhone: (phone: string) => api.get<{ shop: ServerShop }>(`/shops/${encodeURIComponent(phone)}`).then((r) => r.data.shop),
  update: (id: string, body: Partial<{ shopName: string; ownerName: string; state: string; marketName: string; pin: string | null }>) =>
    api.put<{ shop: ServerShop }>(`/shops/${id}`, body).then((r) => r.data.shop),
  resetPin: (phone: string, shopName: string) => api.post('/shops/reset-pin', { phone, shopName }).then((r) => r.data),
};

export const MarketAPI = {
  list: (state: string) => api.get<{ markets: string[] }>('/markets', { params: { state } }).then((r) => r.data.markets),
  add: (state: string, name: string) => api.post('/markets', { state, name }).then((r) => r.data),
};

export const SaleAPI = {
  list: (shop: string) => api.get<{ sales: ServerSale[] }>('/sales', { params: { shop } }).then((r) => r.data.sales),
  create: (body: object) => api.post<{ sale: ServerSale }>('/sales', body).then((r) => r.data.sale),
  update: (id: string, body: object) => api.put<{ sale: ServerSale }>(`/sales/${id}`, body).then((r) => r.data.sale),
  remove: (id: string) => api.delete(`/sales/${id}`),
};

export const DebtAPI = {
  list: (shop: string) => api.get<{ debts: ServerDebt[] }>('/debts', { params: { shop } }).then((r) => r.data.debts),
  create: (body: object) => api.post<{ debt: ServerDebt }>('/debts', body).then((r) => r.data.debt),
  update: (id: string, body: object) => api.put<{ debt: ServerDebt }>(`/debts/${id}`, body).then((r) => r.data.debt),
  markPaid: (id: string) => api.patch<{ debt: ServerDebt }>(`/debts/${id}/mark-paid`).then((r) => r.data.debt),
  remove: (id: string) => api.delete(`/debts/${id}`),
};

export const PaymentAPI = {
  request: (body: { shop: string; plan: 'monthly' | 'launch' | 'yearly'; method: 'transfer' | 'card' }) =>
    api.post<{ paymentRequest: { _id: string; amount: number; status: string } }>('/payments/request', body).then((r) => r.data),
  launchOffer: (phone: string) =>
    api.get<{ available: boolean; remaining: number }>('/payments/launch-offer', { params: { phone } }).then((r) => r.data),
  latest: (shopId: string) =>
    api
      .get<{ paymentRequest: { _id: string; status: 'pending' | 'verified' | 'rejected'; plan: string; amount: number } | null }>(
        `/payments/latest/${shopId}`
      )
      .then((r) => r.data.paymentRequest),
};
