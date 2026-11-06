import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { ScreenProps } from '../navigation';
import { Banner, Button, Card, Muted, Screen } from '../components/ui';
import { PLANS, SUPPORT_WHATSAPP } from '../config';
import { colors } from '../theme';
import { naira } from '../utils/format';
import { PaymentAPI } from '../api/client';

export default function PaymentPendingScreen({ navigation }: ScreenProps<'PaymentPending'>) {
  const { shop, pendingPayment, setPendingPayment, syncNow } = useApp();
  const [status, setStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');

  useEffect(() => {
    if (!shop?.serverId) return;
    let alive = true;
    const check = async () => {
      try {
        const latest = await PaymentAPI.latest(shop.serverId!);
        if (!alive || !latest) return;
        setStatus(latest.status);
        if (latest.status === 'verified') {
          await setPendingPayment(null);
          await syncNow(); // pulls isPaid + subscriptionEndDate
          // If user was already inside the main app (renewing early), show success manually.
          if (navigation.getState().routeNames.includes('PaymentSuccess')) navigation.replace('PaymentSuccess');
        }
      } catch {
        /* offline, retry */
      }
    };
    check();
    const t = setInterval(check, 15_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.serverId]);

  const plan = PLANS.find((p) => p.id === pendingPayment?.plan);
  const sendProof = () => {
    const msg = `Hello Shop Book, I don pay ${naira(pendingPayment?.amount || 0)} for ${plan?.title || ''} plan. Shop: ${shop?.shopName}, Phone: ${shop?.phone}. Here is my receipt:`;
    Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(msg)}`).catch(() => {});
  };

  if (status === 'rejected') {
    return (
      <Screen>
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Text style={{ fontSize: 56 }}>😟</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', textAlign: 'center', color: colors.text }}>We no see your payment</Text>
          <Muted style={{ textAlign: 'center', marginTop: 8 }}>
            Please check the transfer and try again, or send your receipt to us on WhatsApp.
          </Muted>
        </View>
        <Button title="💬 Send Receipt on WhatsApp" onPress={sendProof} style={{ marginBottom: 10 }} />
        <Button
          title="Try Again"
          variant="outline"
          onPress={async () => {
            await setPendingPayment(null);
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.replace('Paywall');
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginVertical: 20 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 16, color: colors.text }}>Thank you! We don get your request</Text>
        <Muted style={{ textAlign: 'center', marginTop: 8 }}>We will verify within 30 minutes. Your app go open by itself once we confirm.</Muted>
      </View>
      {pendingPayment && (
        <Card style={{ marginBottom: 16 }}>
          <Muted>Plan</Muted>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6, color: colors.text }}>{plan?.title}</Text>
          <Muted>Amount</Muted>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primaryDark }}>{naira(pendingPayment.amount)}</Text>
        </Card>
      )}
      <Banner tone="warning" text="Status: Pending verification ⏳" />
      <Button title="💬 Send Receipt on WhatsApp (faster)" variant="outline" onPress={sendProof} style={{ marginBottom: 10 }} />
      <Button title="Check Again" variant="ghost" onPress={syncNow} />
    </Screen>
  );
}
