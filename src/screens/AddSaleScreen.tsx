import React, { useLayoutEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { ScreenProps } from '../navigation';
import { Button, Field, Screen, Segmented, styles } from '../components/ui';
import { colors } from '../theme';

/** Add Sale + Edit Sale (when route.params.localId is set). */
export default function AddSaleScreen({ navigation, route }: ScreenProps<'AddSale'>) {
  const { sales, addSale, updateSale, deleteSale } = useApp();
  const editing = route.params?.localId ? sales.find((s) => s.localId === route.params!.localId) : undefined;

  const [itemDescription, setItem] = useState(editing?.itemDescription || '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [paymentMethod, setMethod] = useState<'cash' | 'transfer'>(editing?.paymentMethod || 'cash');
  const [customerName, setCustomer] = useState(editing?.customerName || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const confirmDelete = () =>
    Alert.alert('Delete sale?', 'Are you sure? This will delete this sale forever', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSale(editing!.localId);
          navigation.goBack();
        },
      },
    ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editing ? 'Edit Sale' : 'Add Sale',
      headerRight: editing
        ? () => (
            <Pressable onPress={confirmDelete} hitSlop={12} accessibilityLabel="Delete sale">
              <Text style={{ color: colors.white, fontSize: 22 }}>🗑️</Text>
            </Pressable>
          )
        : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, editing?.localId]);

  const save = async () => {
    const amt = Number(amount.replace(/[^\d.]/g, ''));
    const e: Record<string, string> = {};
    if (!itemDescription.trim()) e.item = 'Tell us what you sold';
    if (!amt || amt <= 0) e.amount = 'Type the amount';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const data = {
      itemDescription: itemDescription.trim(),
      amount: amt,
      paymentMethod,
      customerName: customerName.trim() || undefined,
    };
    if (editing) {
      await updateSale(editing.localId, data);
      Alert.alert('Sale Updated');
    } else {
      await addSale(data);
    }
    setSaving(false);
    navigation.goBack();
  };

  return (
    <Screen>
      <Field label="What did you sell?" value={itemDescription} onChangeText={setItem} placeholder="e.g. 2 bags of rice" error={errors.item} autoFocus={!editing} />
      <Field
        label="Amount (₦)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="e.g. 5000"
        error={errors.amount}
        style={{ fontSize: 24, fontWeight: '700' }}
      />
      <Text style={styles.label}>How did they pay?</Text>
      <View style={{ marginBottom: 16 }}>
        <Segmented
          value={paymentMethod}
          onChange={setMethod}
          options={[
            { value: 'cash', label: '💵 Cash' },
            { value: 'transfer', label: '🏦 Transfer' },
          ]}
        />
      </View>
      <Field label="Customer Name (optional)" value={customerName} onChangeText={setCustomer} placeholder="e.g. Mama Chidi" />
      <Button title={editing ? 'Save Changes' : 'Save Sale'} onPress={save} loading={saving} />
      {editing && <Button title="Delete Sale" variant="ghost" onPress={confirmDelete} style={{ marginTop: 8 }} />}
    </Screen>
  );
}
