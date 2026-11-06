export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
export const SUPPORT_WHATSAPP = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP || '2347081416213';

export const TRIAL_DAYS = 14;

export const BANK = {
  bank: 'OPay',
  accountNumber: '7081416213',
  accountName: 'Shop Book',
};

export type PlanId = 'monthly' | 'launch' | 'yearly';

export const PLANS: { id: PlanId; title: string; price: number; badge?: string; note: string }[] = [
  { id: 'yearly', title: 'Yearly', price: 20000, badge: 'Most Popular', note: 'Save ₦10,000 vs paying monthly' },
  { id: 'launch', title: 'First Month', price: 1000, badge: 'Launch Offer', note: 'Only for first 100 users. Renews at ₦2,500/month' },
  { id: 'monthly', title: 'Monthly', price: 2500, note: '₦2,500 every month' },
];
