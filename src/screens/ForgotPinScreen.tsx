import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { Button, Field, H1, Muted, Screen } from '../components/ui';

export default function ForgotPinScreen() {
  const { resetPin } = useApp();
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const ok = await resetPin(phone, shopName);
    setLoading(false);
    if (ok) Alert.alert('PIN Removed', 'Your PIN don clear. You can set a new one in Profile.');
    else Alert.alert('No match', 'Phone number or shop name no match this shop. Please check and try again.');
  };

  return (
    <Screen>
      <H1>Reset your PIN</H1>
      <Muted style={{ marginBottom: 20, marginTop: 4 }}>Type the phone number and shop name you used to set up Shop Book.</Muted>
      <Field label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="08012345678" />
      <Field label="Shop Name" value={shopName} onChangeText={setShopName} placeholder="e.g. Blessing Provision Store" autoCapitalize="words" />
      <Button title="Reset PIN" onPress={submit} loading={loading} disabled={!phone || !shopName} />
    </Screen>
  );
}
