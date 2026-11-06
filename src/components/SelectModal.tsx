import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius } from '../theme';
import { styles } from './ui';

/** Dropdown-style picker with search. Optional footer (e.g. "+ Add My Market"). */
export function SelectField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  searchable = true,
  footer,
  error,
  disabled,
}: {
  label: string;
  value?: string;
  placeholder: string;
  options: string[];
  onSelect: (v: string) => void;
  searchable?: boolean;
  footer?: (close: () => void, query: string) => React.ReactNode;
  error?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = useMemo(
    () => (q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options),
    [q, options]
  );
  const close = () => {
    setOpen(false);
    setQ('');
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.input, { justifyContent: 'center', opacity: disabled ? 0.5 : 1 }, error ? { borderColor: colors.danger } : null]}
      >
        <Text style={{ fontSize: 17, color: value ? colors.text : colors.muted }}>{value || placeholder}  ▾</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
            <Text style={[styles.h1, { flex: 1 }]}>{label}</Text>
            <Pressable onPress={close} hitSlop={12}>
              <Text style={{ fontSize: font.body, color: colors.primary, fontWeight: '700' }}>Close</Text>
            </Pressable>
          </View>
          {searchable && (
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <TextInput
                autoFocus
                value={q}
                onChangeText={setQ}
                placeholder="Search..."
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>
          )}
          <FlatList
            data={filtered}
            keyExtractor={(i) => i}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            ListEmptyComponent={<Text style={[styles.muted, { padding: 16 }]}>Nothing found.</Text>}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  close();
                }}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  borderRadius: radius,
                  backgroundColor: item === value ? colors.primaryLight : colors.white,
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 17, color: colors.text, fontWeight: item === value ? '700' : '400' }}>{item}</Text>
              </Pressable>
            )}
            ListFooterComponent={footer ? <View style={{ marginTop: 8 }}>{footer(close, q)}</View> : null}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
