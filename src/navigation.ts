import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Setup: undefined;
  PinLock: undefined;
  ForgotPin: undefined;
  Paywall: undefined;
  PaymentPending: undefined;
  PaymentSuccess: undefined;
  Dashboard: undefined;
  AddSale: { localId?: string } | undefined;
  SalesList: undefined;
  DebtBook: undefined;
  AddDebt: undefined;
  EditDebt: { localId: string };
  DebtDetail: { localId: string };
  Profile: undefined;
  EditProfile: undefined;
  PinSetup: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
