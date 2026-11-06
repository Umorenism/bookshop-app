import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../context/AppContext';
import { ScreenProps } from '../navigation';
import { Banner, Button, Card, Muted, Screen } from '../components/ui';
import { BANK, PLANS, PlanId } from '../config';
import { colors, radius } from '../theme';
import { naira } from '../utils/format';
import { errorMessage, PaymentAPI } from '../api/client';
import { hasAccess } from '../utils/access';
import { storage } from '../storage/storage';

export default function PaywallScreen({ navigation }: ScreenProps<'Paywall'>) {
  const { shop, debts, sales, online, setPendingPayment, syncNow, logout } = useApp();
  const [plan, setPlan] = useState<PlanId>('yearly'); // default selected = Yearly
  const [method, setMethod] = useState<'none' | 'transfer'>('none');
  const [launch, setLaunch] = useState<{ available: boolean; remaining: number } | null>(null);
  const [sending, setSending] = useState(false);

  const locked = shop ? !hasAccess(shop) : true;
  const lockedMoney = useMemo(() => debts.filter((d) => d.status === 'owing').reduce((a, d) => a + d.amount, 0), [debts]);

  useEffect(() => {
    if (!shop) return;
    PaymentAPI.launchOffer(shop.phone)
      .then(setLaunch)
      .catch(() => setLaunch(null));
  }, [shop?.phone]);

  const launchBlocked = !!shop?.hasUsedLaunchOffer || (launch !== null && !launch.available);
  const selected = PLANS.find((p) => p.id === plan)!;

  const copy = async () => {
    await Clipboard.setStringAsync(BANK.accountNumber);
    Alert.alert('Copied', `Account number ${BANK.accountNumber} don copy.`);
  };

  const iDonPay = async () => {
    if (!shop) return;
    if (!online) return Alert.alert('No internet', 'Please connect to internet so we can see your payment.');
    setSending(true);
    try {
      if (!shop.serverId) await syncNow();
      const id = shop.serverId || (await storage.getShop())?.serverId;
      if (!id) throw new Error('Shop not synced');
      const res = await PaymentAPI.request({ shop: id, plan, method: 'transfer' });
      await setPendingPayment({ id: res.paymentRequest._id, plan, amount: res.paymentRequest.amount, createdAt: new Date().toISOString() });
      navigation.navigate('PaymentPending');
    } catch (e) {
      Alert.alert('Could not send', e instanceof Error && e.message === 'Shop not synced' ? 'Please try again in a moment.' : errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      {locked ? (
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 48 }}>🔒</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
            {shop?.isLocked ? 'Your Shop Book Don Lock' : shop?.isPaid ? 'Your Subscription Don Finish' : 'Your Free 14 Days Don Finish'}
          </Text>
          <Card style={{ marginTop: 12, alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.dangerLight, borderColor: colors.dangerLight }}>
            <Text style={{ fontSize: 18, color: colors.danger, fontWeight: '700' }}>You have {naira(lockedMoney)} locked</Text>
            <Muted style={{ textAlign: 'center', marginTop: 4 }}>
              Money people owe you + {sales.length} sales records. Nothing is deleted. Pay to open your book again.
            </Muted>
          </Card>
        </View>
      ) : (
        <Banner tone="success" text="Pay now and continue without stopping when your trial finish." />
      )}

      <Text style={{ fontSize: 19, fontWeight: '800', marginBottom: 10, color: colors.text }}>Choose your plan</Text>
      {PLANS.map((p) => {
        const disabled = p.id === 'launch' && launchBlocked;
        const active = plan === p.id;
        return (
          <Pressable
            key={p.id}
            disabled={disabled}
            onPress={() => setPlan(p.id)}
            accessibilityState={{ selected: active, disabled }}
            style={{
              borderWidth: 2,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primaryLight : colors.white,
              borderRadius: radius,
              padding: 16,
              marginBottom: 10,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 22, marginRight: 10 }}>{active ? '🔘' : '⚪'}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{p.title}</Text>
                  {p.badge && (
                    <View style={{ backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ color: colors.white, fontSize: 13, fontWeight: '800' }}>{p.badge}</Text>
                    </View>
                  )}
                </View>
                <Muted style={{ fontSize: 15 }}>
                  {disabled ? 'Launch offer no dey for you again' : p.note}
                  {p.id === 'launch' && !disabled && launch ? ` · ${launch.remaining} spots left` : ''}
                </Muted>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primaryDark }}>{naira(p.price)}</Text>
            </View>
          </Pressable>
        );
      })}

      <View style={{ height: 8 }} />
      {method === 'none' ? (
        <>
          <Button title={`🏦 Pay With Transfer · ${naira(selected.price)}`} onPress={() => setMethod('transfer')} style={{ marginBottom: 10 }} />
          <Button
            title="💳 Pay With Card"
            variant="outline"
            onPress={() => Alert.alert('Coming soon', 'Card payment (Paystack) is coming soon. Please use Bank Transfer for now.')}
          />
        </>
      ) : (
        <Card>
          <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8, color: colors.text }}>
            Send {naira(selected.price)} to:
          </Text>
          <Muted>Bank</Muted>
          <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8, color: colors.text }}>{BANK.bank}</Text>
          <Muted>Account Number</Muted>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', letterSpacing: 1, flex: 1, color: colors.text }}>{BANK.accountNumber}</Text>
            <Button title="Copy" variant="outline" onPress={copy} style={{ minHeight: 42, paddingHorizontal: 18 }} />
          </View>
          <Muted>Account Name</Muted>
          <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 16, color: colors.text }}>{BANK.accountName}</Text>
          <Button title="✅ I Don Pay" onPress={iDonPay} loading={sending} />
          <Muted style={{ textAlign: 'center', marginTop: 8, fontSize: 15 }}>We will verify within 30 minutes.</Muted>
          <Button title="Back" variant="ghost" onPress={() => setMethod('none')} style={{ marginTop: 4 }} />
        </Card>
      )}

      {locked && (
        <Text
          onPress={() =>
            Alert.alert('Logout?', 'Your data is safe on our server if it synced. You can log back in with the same phone number.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout },
            ])
          }
          style={{ textAlign: 'center', color: colors.muted, marginTop: 20, fontSize: 15 }}
        >
          Logout
        </Text>
      )}
    </Screen>
  );
}
