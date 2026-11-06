import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { ScreenProps } from '../navigation';
import { PinDots, PinPad } from '../components/PinPad';
import { colors } from '../theme';

export default function PinLockScreen({ navigation }: ScreenProps<'PinLock'>) {
  const { shop, checkPin } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [tries, setTries] = useState(0);

  const onDigit = async (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setError(false);
    setPin(next);
    if (next.length === 4) {
      const ok = await checkPin(next);
      if (!ok) {
        setError(true);
        setTries((t) => t + 1);
        setTimeout(() => setPin(''), 400);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24 }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 48 }}>🔐</Text>
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 8 }}>{shop?.shopName}</Text>
        <Text style={{ fontSize: 17, color: colors.muted, marginTop: 4 }}>Enter your 4-digit PIN</Text>
      </View>
      <PinDots length={4} filled={pin.length} error={error} />
      {error && (
        <Text style={{ textAlign: 'center', color: colors.danger, fontSize: 16, marginBottom: 8 }}>
          Wrong PIN. {tries >= 3 ? 'Forgot it? Reset below.' : 'Try again.'}
        </Text>
      )}
      <PinPad onDigit={onDigit} onDelete={() => setPin((p) => p.slice(0, -1))} />
      <Text
        onPress={() => navigation.navigate('ForgotPin')}
        style={{ textAlign: 'center', color: colors.primary, fontSize: 17, fontWeight: '700', marginTop: 24 }}
      >
        Forgot PIN?
      </Text>
    </SafeAreaView>
  );
}
