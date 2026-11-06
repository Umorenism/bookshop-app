import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { ScreenProps } from '../navigation';
import { PinDots, PinPad } from '../components/PinPad';
import { Button, Screen } from '../components/ui';
import { colors } from '../theme';

export default function PinSetupScreen({ navigation }: ScreenProps<'PinSetup'>) {
  const { shop, setPin, removePin } = useApp();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [first, setFirst] = useState('');
  const [pin, setPinText] = useState('');
  const [error, setError] = useState('');

  const onDigit = async (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPinText(next);
    setError('');
    if (next.length < 4) return;
    if (step === 'enter') {
      setFirst(next);
      setTimeout(() => {
        setPinText('');
        setStep('confirm');
      }, 200);
    } else if (next === first) {
      await setPin(next);
      Alert.alert('PIN Set', 'Shop Book go ask for this PIN every time you open it.');
      navigation.goBack();
    } else {
      setError('PINs no match. Start again.');
      setTimeout(() => {
        setPinText('');
        setFirst('');
        setStep('enter');
      }, 500);
    }
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
          {step === 'enter' ? (shop?.pinHash ? 'Enter new PIN' : 'Choose a 4-digit PIN') : 'Type the PIN again'}
        </Text>
        <Text style={{ fontSize: 16, color: colors.muted, marginTop: 4, textAlign: 'center' }}>
          PIN protects your records if someone else holds your phone.
        </Text>
      </View>
      <PinDots length={4} filled={pin.length} error={!!error} />
      {error ? <Text style={{ textAlign: 'center', color: colors.danger, fontSize: 16, marginBottom: 8 }}>{error}</Text> : null}
      <PinPad onDigit={onDigit} onDelete={() => setPinText((p) => p.slice(0, -1))} />
      {shop?.pinHash && (
        <Button
          title="Remove PIN"
          variant="ghost"
          style={{ marginTop: 16 }}
          onPress={() =>
            Alert.alert('Remove PIN?', 'Anybody wey hold your phone go fit open Shop Book.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                  await removePin();
                  navigation.goBack();
                },
              },
            ])
          }
        />
      )}
    </Screen>
  );
}
