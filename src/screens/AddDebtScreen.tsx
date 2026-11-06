import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation';
import { Button, Field, Screen, styles } from '../components/ui';
import { colors, radius } from '../theme';
import { addDays, isValidPhone, normalizePhone, parseDateInput, prettyDate, toInputDate } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AddDebt' | 'EditDebt'>;

const QUICK = [
  { label: 'Tomorrow', days: 1 },
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
];

/** Add Debt + Edit Debt (route "EditDebt" with localId). Debt CAN be edited anytime. */
export default function AddDebtScreen({ navigation, route }: Props) {
  const { debts, addDebt, updateDebt } = useApp();
  const localId = (route.params as { localId?: string } | undefined)?.localId;
  const editing = localId ? debts.find((d) => d.localId === localId) : undefined;

  const [customerName, setName] = useState(editing?.customerName || '');
  const [customerPhone, setPhone] = useState(editing?.customerPhone || '');
  const [item, setItem] = useState(editing?.item || '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [dueText, setDueText] = useState(editing ? toInputDate(editing.dueDate) : toInputDate(addDays(new Date(), 7).toISOString()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const dueISO = parseDateInput(dueText);

  const save = async () => {
    const amt = Number(amount.replace(/[^\d.]/g, ''));
    const e: Record<string, string> = {};
    if (customerName.trim().length < 2) e.name = 'Type customer name';
    if (!isValidPhone(customerPhone)) e.phone = 'Customer phone is required, e.g. 08012345678';
    if (!item.trim()) e.item = 'What did they collect?';
    if (!amt || amt <= 0) e.amount = 'Type the amount';
    if (!dueISO) e.due = 'Use format DD/MM/YYYY';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    const data = {
      customerName: customerName.trim(),
      customerPhone: normalizePhone(customerPhone),
      item: item.trim(),
      amount: amt,
      dueDate: dueISO!,
    };
    if (editing) {
      await updateDebt(editing.localId, data);
      Alert.alert('Debt Updated');
    } else {
      await addDebt(data);
      Alert.alert('Debt Saved', `${data.customerName} don enter your Debt Book.`);
    }
    setSaving(false);
    navigation.goBack();
  };

  if (localId && !editing) {
    return (
      <Screen>
        <Text style={styles.muted}>This debt no longer exists.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Field label="Customer Name" value={customerName} onChangeText={setName} placeholder="e.g. Mama Chidi" error={errors.name} />
      <Field
        label="Customer Phone (required)"
        value={customerPhone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="08012345678"
        error={errors.phone}
        hint="So you can remind them on WhatsApp."
      />
      <Field label="Item" value={item} onChangeText={setItem} placeholder="e.g. 1 carton of Indomie" error={errors.item} />
      <Field label="Amount (₦)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="e.g. 7500" error={errors.amount} style={{ fontSize: 24, fontWeight: '700' }} />

      <Text style={styles.label}>Date to pay</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {QUICK.map((qd) => {
          const v = toInputDate(addDays(new Date(), qd.days).toISOString());
          const active = v === dueText;
          return (
            <Pressable
              key={qd.label}
              onPress={() => setDueText(v)}
              style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primaryLight : colors.white }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: active ? colors.primaryDark : colors.text }}>{qd.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Field
        label="Or type date (DD/MM/YYYY)"
        value={dueText}
        onChangeText={setDueText}
        keyboardType="numbers-and-punctuation"
        error={errors.due}
        hint={dueISO ? `Pay by: ${prettyDate(dueISO)}` : undefined}
      />
      <Button title={editing ? 'Save Changes' : 'Save Debt'} onPress={save} loading={saving} />
    </Screen>
  );
}
