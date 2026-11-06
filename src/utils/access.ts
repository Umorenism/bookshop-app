import { TRIAL_DAYS } from '../config';
import { Shop } from '../types';

const DAY = 24 * 60 * 60 * 1000;

export const trialDaysLeft = (shop: Shop): number => {
  const start = new Date(shop.trialStartDate).getTime();
  const end = start + TRIAL_DAYS * DAY;
  return Math.max(0, Math.ceil((end - Date.now()) / DAY));
};

export const hasActiveSubscription = (shop: Shop): boolean =>
  !!shop.isPaid && !!shop.subscriptionEndDate && new Date(shop.subscriptionEndDate).getTime() > Date.now();

/** App is usable during trial or with an active paid subscription. Otherwise: HARD LOCK (data kept). */
export const hasAccess = (shop: Shop): boolean =>
  !shop.isLocked && (hasActiveSubscription(shop) || trialDaysLeft(shop) > 0);

export const subscriptionLabel = (shop: Shop): string => {
  if (shop.isLocked) return 'Locked';
  if (hasActiveSubscription(shop)) return 'Paid';
  if (trialDaysLeft(shop) > 0) return 'Free Trial';
  return shop.isPaid ? 'Subscription Expired' : 'Trial Expired';
};
