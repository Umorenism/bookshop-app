import React, { useLayoutEffect } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { ScreenProps } from '../navigation';
import { Banner, Button, Card, EmptyState, Muted, Screen } from '../components/ui';
import { colors } from '../theme';
import { naira, prettyDate, toWhatsAppNumber } from '../utils/format';

export default function DebtDetailScreen({ navigation, route }: ScreenProps<'DebtDetail'>) {
  const { debts, shop, markDebtPaid, deleteDebt } = useApp();
  const debt = debts.find((d) => d.localId === route.params.localId);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: debt
        ? () => (
            <Pressable onPress={() => navigation.navigate('EditDebt', { localId: debt.localId })} hitSlop={12} accessibilityLabel="Edit debt">
              <Text style={{ color: colors.white, fontSize: 22 }}>✏️</Text>
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, debt?.localId]);

  if (!debt) {
    return (
      <Screen>
        <EmptyState icon="🤷🏾" title="Debt not found" text="It may have been deleted." action={<Button title="Back to Debt Book" onPress={() => navigation.goBack()} />} />
      </Screen>
    );
  }

  const overdue = debt.status === 'owing' && new Date(debt.dueDate).getTime() < Date.now();

  const remind = async () => {
    const msg = `Hello ${debt.customerName}, you still owe ${shop?.shopName} ${naira(debt.amount)} for ${debt.item}. Abeg pay before ${prettyDate(debt.dueDate)}. Thank you - Shop Book`;
    const url = `https://wa.me/${toWhatsAppNumber(debt.customerPhone)}?text=${encodeURIComponent(msg)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('WhatsApp', 'Could not open WhatsApp on this phone.');
    }
  };

  const markPaid = () =>
    Alert.alert('Mark as paid?', `${debt.customerName} don pay ${naira(debt.amount)}?`, [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Yes, Paid', onPress: () => markDebtPaid(debt.localId) },
    ]);

  const confirmDelete = () =>
    Alert.alert('Delete debt?', 'Are you sure? This will delete this debt forever', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDebt(debt.localId);
          navigation.goBack();
        },
      },
    ]);

  const Row = ({ k, v }: { k: string; v: string }) => (
    <View style={{ flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Muted style={{ flex: 1 }}>{k}</Muted>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, flex: 1.4, textAlign: 'right' }}>{v}</Text>
    </View>
  );

  return (
    <Screen>
      {debt.status === 'paid' ? (
        <Banner tone="success" text={`✅ Paid on ${prettyDate(debt.paidAt)}`} />
      ) : overdue ? (
        <Banner tone="danger" text="⚠️ This debt don pass due date" />
      ) : null}

      <Card style={{ alignItems: 'center', marginBottom: 12 }}>
        <Muted>{debt.customerName} owes</Muted>
        <Text style={{ fontSize: 36, fontWeight: '800', color: debt.status === 'paid' ? colors.primaryDark : colors.danger }}>{naira(debt.amount)}</Text>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row k="Customer" v={debt.customerName} />
        <Row k="Phone" v={debt.customerPhone} />
        <Row k="Item" v={debt.item} />
        <Row k="Amount" v={naira(debt.amount)} />
        <Row k="Date to pay" v={prettyDate(debt.dueDate)} />
        <Row k="Status" v={debt.status === 'paid' ? 'Paid' : 'Owing'} />
        <Row k="Added on" v={prettyDate(debt.createdAt)} />
      </Card>

      {debt.status === 'owing' && (
        <>
          <Button title="✅ Mark As Paid" onPress={markPaid} style={{ marginBottom: 10 }} />
          <Button title="💬 Remind via WhatsApp" variant="outline" onPress={remind} style={{ marginBottom: 10 }} />
        </>
      )}
      <Button title="✏️ Edit Debt" variant="ghost" onPress={() => navigation.navigate('EditDebt', { localId: debt.localId })} />
      <Button title="🗑️ Delete Debt" variant="ghost" onPress={confirmDelete} style={{ marginTop: 4 }} />
    </Screen>
  );
}
