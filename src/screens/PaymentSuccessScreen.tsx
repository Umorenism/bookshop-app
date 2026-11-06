import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { ScreenProps } from '../navigation';
import { Button } from '../components/ui';
import { colors } from '../theme';
import { prettyDate } from '../utils/format';

export default function PaymentSuccessScreen({ navigation }: ScreenProps<'PaymentSuccess'>) {
  const { shop, clearJustUnlocked } = useApp();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 80 }}>🎉</Text>
        <Text style={{ fontSize: 30, fontWeight: '800', color: colors.white, textAlign: 'center', marginTop: 12 }}>
          Your Shop Book Don Unlock
        </Text>
        <Text style={{ fontSize: 20, color: colors.white, marginTop: 10, textAlign: 'center' }}>
          Valid till {prettyDate(shop?.subscriptionEndDate)}
        </Text>
        <Text style={{ fontSize: 16, color: colors.primaryLight, marginTop: 8, textAlign: 'center' }}>
          Thank you for trusting Shop Book. All your records are back.
        </Text>
      </View>
      <View style={{ padding: 24 }}>
        <Button
          title="Open My Shop Book"
          variant="outline"
          onPress={() => {
            clearJustUnlocked();
            navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
          }}
        />
      </View>
    </SafeAreaView>
  );
}
