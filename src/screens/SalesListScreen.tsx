import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { ScreenProps } from '../navigation';
import { Button, EmptyState, styles } from '../components/ui';
import { Sale } from '../types';
import { colors, radius } from '../theme';
import { naira, prettyDate, prettyTime } from '../utils/format';

export function SaleRow({
  sale,
  subtitle,
  onPress,
  onEdit,
  onDelete,
}: {
  sale: Sale;
  subtitle?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: colors.white, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 8 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }} numberOfLines={1}>
            {sale.itemDescription}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 2 }}>
            {sale.paymentMethod === 'cash' ? '💵 Cash' : '🏦 Transfer'}
            {sale.customerName ? ` · ${sale.customerName}` : ''}
            {subtitle ? ` · ${subtitle}` : ''}
            {sale.sync === 'pending' ? ' · ⏳' : ''}
          </Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primaryDark }}>{naira(sale.amount)}</Text>
      </View>
      {(onEdit || onDelete) && (
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
          {onEdit && (
            <Text onPress={onEdit} style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>
              ✏️ Edit
            </Text>
          )}
          {onDelete && (
            <Text onPress={onDelete} style={{ color: colors.danger, fontWeight: '700', fontSize: 16 }}>
              🗑️ Delete
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function SalesListScreen({ navigation }: ScreenProps<'SalesList'>) {
  const { sales, deleteSale } = useApp();
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t
      ? sales.filter((s) => s.itemDescription.toLowerCase().includes(t) || (s.customerName || '').toLowerCase().includes(t))
      : sales;
  }, [sales, q]);
  const total = list.reduce((a, s) => a + s.amount, 0);

  const confirmDelete = (s: Sale) =>
    Alert.alert('Delete sale?', 'Are you sure? This will delete this sale forever', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSale(s.localId) },
    ]);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <TextInput value={q} onChangeText={setQ} placeholder="🔍 Search sales..." placeholderTextColor={colors.muted} style={styles.input} />
        <Text style={{ marginTop: 8, fontSize: 16, color: colors.muted }}>
          {list.length} sale(s) · Total <Text style={{ fontWeight: '800', color: colors.text }}>{naira(total)}</Text>
        </Text>
      </View>
      <FlatList
        data={list}
        keyExtractor={(s) => s.localId}
        contentContainerStyle={{ padding: 16, paddingTop: 0, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon="🛒"
            title={q ? 'No sale match' : 'No sale yet'}
            text={q ? 'Try another word.' : 'Your sales will show here.'}
            action={!q ? <Button title="+ Add Sale" onPress={() => navigation.navigate('AddSale')} /> : undefined}
          />
        }
        renderItem={({ item }) => (
          <SaleRow
            sale={item}
            subtitle={`${prettyDate(item.createdAt)} ${prettyTime(item.createdAt)}`}
            onEdit={() => navigation.navigate('AddSale', { localId: item.localId })}
            onDelete={() => confirmDelete(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}
