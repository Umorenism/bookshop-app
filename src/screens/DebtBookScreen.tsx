import React, { useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { ScreenProps } from '../navigation';
import { Button, EmptyState, Segmented, styles } from '../components/ui';
import { colors, radius } from '../theme';
import { naira, prettyDate } from '../utils/format';

type Filter = 'owing' | 'paid' | 'all';

export default function DebtBookScreen({ navigation }: ScreenProps<'DebtBook'>) {
  const { debts } = useApp();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('owing');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('AddDebt')} hitSlop={12} accessibilityLabel="Add debt">
          <Text style={{ color: colors.white, fontSize: 17, fontWeight: '800' }}>+ Add</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return debts
      .filter((d) => filter === 'all' || d.status === filter)
      .filter((d) => !t || d.customerName.toLowerCase().includes(t) || d.item.toLowerCase().includes(t) || d.customerPhone.includes(t));
  }, [debts, q, filter]);

  const totalOwing = debts.filter((d) => d.status === 'owing').reduce((a, d) => a + d.amount, 0);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16, paddingBottom: 8, gap: 10 }}>
        <View style={{ backgroundColor: colors.dangerLight, borderRadius: radius, padding: 14 }}>
          <Text style={{ fontSize: 16, color: colors.danger }}>People owe you</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.danger }}>{naira(totalOwing)}</Text>
        </View>
        <TextInput value={q} onChangeText={setQ} placeholder="🔍 Search name, phone or item" placeholderTextColor={colors.muted} style={styles.input} />
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'owing', label: 'Owing' },
            { value: 'paid', label: 'Paid' },
            { value: 'all', label: 'All' },
          ]}
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(d) => d.localId}
        contentContainerStyle={{ padding: 16, paddingTop: 4, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon="📕"
            title={debts.length === 0 ? 'Nobody owes you yet' : 'Nothing here'}
            text={debts.length === 0 ? 'When a customer buys on credit, add it here so you no go forget.' : 'Try another search or filter.'}
            action={debts.length === 0 ? <Button title="+ Add Debt" onPress={() => navigation.navigate('AddDebt')} /> : undefined}
          />
        }
        renderItem={({ item }) => {
          const overdue = item.status === 'owing' && new Date(item.dueDate).getTime() < Date.now();
          return (
            <Pressable
              onPress={() => navigation.navigate('DebtDetail', { localId: item.localId })}
              style={{ backgroundColor: colors.white, borderRadius: radius, borderWidth: 1, borderColor: overdue ? colors.danger : colors.border, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{item.customerName}</Text>
                <Text style={{ fontSize: 14, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
                  {item.item} · {item.status === 'paid' ? `Paid ${prettyDate(item.paidAt)}` : `${overdue ? '⚠️ Overdue ' : 'Due '}${prettyDate(item.dueDate)}`}
                  {item.sync === 'pending' ? ' · ⏳' : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: item.status === 'paid' ? colors.primaryDark : colors.danger }}>
                  {naira(item.amount)}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: item.status === 'paid' ? colors.primary : colors.warning }}>
                  {item.status === 'paid' ? 'PAID' : 'OWING'}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
