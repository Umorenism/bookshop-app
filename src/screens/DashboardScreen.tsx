import React, { useLayoutEffect, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { ScreenProps } from '../navigation';
import { Banner, Button, Card, EmptyState, Muted } from '../components/ui';
import { colors, font } from '../theme';
import { isSameDay, naira, prettyTime } from '../utils/format';
import { hasActiveSubscription, trialDaysLeft } from '../utils/access';
import { SaleRow } from './SalesListScreen';

export default function DashboardScreen({ navigation }: ScreenProps<'Dashboard'>) {
  const { shop, sales, debts, online, syncing, syncNow } = useApp();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: shop?.shopName || 'Shop Book',
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Profile')} hitSlop={12} accessibilityLabel="Profile">
          <Text style={{ color: colors.white, fontSize: 24 }}>👤</Text>
        </Pressable>
      ),
    });
  }, [navigation, shop?.shopName]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = sales.filter((s) => isSameDay(new Date(s.createdAt), now));
    return {
      todaySales: today.reduce((a, s) => a + s.amount, 0),
      cashToday: today.filter((s) => s.paymentMethod === 'cash').reduce((a, s) => a + s.amount, 0),
      debtOwed: debts.filter((d) => d.status === 'owing').reduce((a, d) => a + d.amount, 0),
      owingCount: debts.filter((d) => d.status === 'owing').length,
    };
  }, [sales, debts]);

  if (!shop) return null;
  const paid = hasActiveSubscription(shop);
  const days = trialDaysLeft(shop);
  const recent = sales.slice(0, 10);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={syncNow} colors={[colors.primary]} />}
      >
        {!online && <Banner tone="warning" text="📴 You are offline. Everything is saved on your phone." />}
        {!paid && (
          <Pressable onPress={() => navigation.navigate('Paywall')}>
            <Banner
              tone={days <= 3 ? 'danger' : 'success'}
              text={`Free trial: ${days} day${days === 1 ? '' : 's'} left${days <= 3 ? ' — Tap to pay now' : ''}`}
            />
          </Pressable>
        )}

        <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary, marginBottom: 12 }}>
          <Text style={{ color: colors.white, fontSize: font.body, opacity: 0.9 }}>Today Sales</Text>
          <Text style={{ color: colors.white, fontSize: 34, fontWeight: '800' }}>{naira(stats.todaySales)}</Text>
        </Card>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <Card style={{ flex: 1 }}>
            <Muted>Total Debt Owed</Muted>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.danger }}>{naira(stats.debtOwed)}</Text>
            <Muted style={{ fontSize: 14 }}>{stats.owingCount} customer(s)</Muted>
          </Card>
          <Card style={{ flex: 1 }}>
            <Muted>Cash Today</Muted>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{naira(stats.cashToday)}</Text>
            <Muted style={{ fontSize: 14 }}>Transfer: {naira(stats.todaySales - stats.cashToday)}</Muted>
          </Card>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <Button title="+ Add Sale" onPress={() => navigation.navigate('AddSale')} style={{ flex: 1 }} />
          <Button title="📕 Debt Book" variant="outline" onPress={() => navigation.navigate('DebtBook')} style={{ flex: 1 }} />
        </View>
        <Button title="+ Add Debt" variant="ghost" onPress={() => navigation.navigate('AddDebt')} />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
          <Text style={{ flex: 1, fontSize: 19, fontWeight: '800', color: colors.text }}>Recent Sales</Text>
          {sales.length > 0 && (
            <Text onPress={() => navigation.navigate('SalesList')} style={{ color: colors.primary, fontWeight: '700', fontSize: font.body }}>
              See all →
            </Text>
          )}
        </View>

        {recent.length === 0 ? (
          <Card>
            <EmptyState
              icon="🛒"
              title="No sale yet"
              text="When you sell something, tap + Add Sale to record it."
              action={<Button title="+ Add First Sale" onPress={() => navigation.navigate('AddSale')} />}
            />
          </Card>
        ) : (
          recent.map((s) => (
            <SaleRow
              key={s.localId}
              sale={s}
              subtitle={prettyTime(s.createdAt)}
              onPress={() => navigation.navigate('AddSale', { localId: s.localId })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
