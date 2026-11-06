import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Banner, Button, Field, H1, Muted, Screen } from '../components/ui';
import { MarketPicker } from '../components/MarketPicker';
import { isValidPhone } from '../utils/format';
import { errorMessage } from '../api/client';
import { colors } from '../theme';

export default function SetupScreen() {
  const { registerShop } = useApp();
  const [state, setState] = useState('');
  const [marketName, setMarketName] = useState('');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!state) e.state = 'Choose your state';
    if (!marketName) e.market = 'Choose or add your market';
    if (shopName.trim().length < 2) e.shopName = 'Type your shop name';
    if (ownerName.trim().length < 2) e.ownerName = 'Type your name';
    if (!isValidPhone(phone)) e.phone = 'Type a correct phone number, e.g. 08012345678';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const res = await registerShop({
        state,
        marketName,
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone,
      });
      if (res.existing) {
        Alert.alert('Welcome back!', 'We found your shop. Your records don come back. Your free trial does not start again.');
      }
    } catch (err) {
      Alert.alert('Could not set up', errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 44 }}>📒</Text>
        <H1>Welcome to Shop Book</H1>
        <Muted style={{ textAlign: 'center', marginTop: 4 }}>Record your sales. Know who owes you. Works without internet.</Muted>
      </View>
      <Banner tone="success" text="🎉 You get 14 days FREE. No card needed." />

      <MarketPicker
        state={state}
        market={marketName}
        onChange={(s, m) => {
          setState(s);
          setMarketName(m);
        }}
        errors={{ state: errors.state, market: errors.market }}
      />
      <Field label="Shop Name" value={shopName} onChangeText={setShopName} placeholder="e.g. Blessing Provision Store" error={errors.shopName} />
      <Field label="Owner Name" value={ownerName} onChangeText={setOwnerName} placeholder="Your name" error={errors.ownerName} />
      <Field
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="08012345678"
        maxLength={14}
        error={errors.phone}
        hint="We use this to find your shop if you change phone."
      />
      <Button title="Start My Free 14 Days" onPress={submit} loading={loading} />
      <Text style={{ textAlign: 'center', color: colors.muted, marginTop: 12, fontSize: 14 }}>
        No internet? No wahala. We go save am and sync later.
      </Text>
    </Screen>
  );
}
