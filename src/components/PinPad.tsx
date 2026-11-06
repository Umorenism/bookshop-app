import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme';

export function PinDots({ length, filled, error }: { length: number; filled: number; error?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center', marginVertical: 24 }}>
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: error ? colors.danger : colors.primary,
            backgroundColor: i < filled ? (error ? colors.danger : colors.primary) : 'transparent',
          }}
        />
      ))}
    </View>
  );
}

export function PinPad({ onDigit, onDelete }: { onDigit: (d: string) => void; onDelete: () => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320, alignSelf: 'center' }}>
      {keys.map((k, i) => (
        <Pressable
          key={i}
          disabled={!k}
          onPress={() => (k === '⌫' ? onDelete() : onDigit(k))}
          accessibilityLabel={k === '⌫' ? 'Delete' : k}
          style={({ pressed }) => ({
            width: 84,
            height: 72,
            margin: 6,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: k ? (pressed ? colors.primaryLight : colors.white) : 'transparent',
            borderWidth: k ? 1 : 0,
            borderColor: colors.border,
          })}
        >
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}
