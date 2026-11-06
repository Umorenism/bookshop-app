import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { RootStackParamList } from './src/navigation';
import { colors } from './src/theme';
import { Loading } from './src/components/ui';

import SetupScreen from './src/screens/SetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddSaleScreen from './src/screens/AddSaleScreen';
import SalesListScreen from './src/screens/SalesListScreen';
import DebtBookScreen from './src/screens/DebtBookScreen';
import AddDebtScreen from './src/screens/AddDebtScreen';
import DebtDetailScreen from './src/screens/DebtDetailScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import PaymentPendingScreen from './src/screens/PaymentPendingScreen';
import PaymentSuccessScreen from './src/screens/PaymentSuccessScreen';
import PinLockScreen from './src/screens/PinLockScreen';
import ForgotPinScreen from './src/screens/ForgotPinScreen';
import PinSetupScreen from './src/screens/PinSetupScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 19 },
  contentStyle: { backgroundColor: colors.bg },
};

function RootNavigator() {
  const { ready, shop, pinLocked, access, pendingPayment, justUnlocked } = useApp();
  if (!ready) return <Loading />;

  // 1. No shop yet -> Setup
  if (!shop) {
    return (
      <Stack.Navigator key="setup" screenOptions={screenOptions}>
        <Stack.Screen name="Setup" component={SetupScreen} options={{ title: 'Set Up Your Shop' }} />
      </Stack.Navigator>
    );
  }

  // 2. PIN lock
  if (pinLocked) {
    return (
      <Stack.Navigator key="pin" screenOptions={screenOptions}>
        <Stack.Screen name="PinLock" component={PinLockScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPin" component={ForgotPinScreen} options={{ title: 'Forgot PIN' }} />
      </Stack.Navigator>
    );
  }

  // 3. HARD LOCK: trial/subscription finished. Data is kept, only locked.
  if (!access) {
    return (
      <Stack.Navigator key="locked" screenOptions={screenOptions} initialRouteName={pendingPayment ? 'PaymentPending' : 'Paywall'}>
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ title: 'Shop Book', headerBackVisible: false }} />
        <Stack.Screen name="PaymentPending" component={PaymentPendingScreen} options={{ title: 'Payment Sent' }} />
      </Stack.Navigator>
    );
  }

  // 4. Main app
  return (
    <Stack.Navigator key="main" screenOptions={screenOptions} initialRouteName={justUnlocked ? 'PaymentSuccess' : 'Dashboard'}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Shop Book' }} />
      <Stack.Screen name="AddSale" component={AddSaleScreen} options={{ title: 'Add Sale' }} />
      <Stack.Screen name="SalesList" component={SalesListScreen} options={{ title: 'All Sales' }} />
      <Stack.Screen name="DebtBook" component={DebtBookScreen} options={{ title: 'Debt Book' }} />
      <Stack.Screen name="AddDebt" component={AddDebtScreen} options={{ title: 'Add Debt' }} />
      <Stack.Screen name="EditDebt" component={AddDebtScreen} options={{ title: 'Edit Debt' }} />
      <Stack.Screen name="DebtDetail" component={DebtDetailScreen} options={{ title: 'Debt Details' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="PinSetup" component={PinSetupScreen} options={{ title: 'PIN Lock' }} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ title: 'Renew / Upgrade' }} />
      <Stack.Screen name="PaymentPending" component={PaymentPendingScreen} options={{ title: 'Payment Sent' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
