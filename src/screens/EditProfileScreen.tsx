import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { ScreenProps } from '../navigation';
import { Button, Field, Muted, Screen } from '../components/ui';
import { MarketPicker } from '../components/MarketPicker';

export default function EditProfileScreen({ navigation }: ScreenProps<'EditProfile'>) {
  const { shop, updateShop } = useApp();
  const [shopName, setShopName] = useState(shop?.shopName || '');
  const [ownerName, setOwnerName] = useState(shop?.ownerName || '');
  const [state, setState] = useState(shop?.state || '');
  const [marketName, setMarket] = useState(shop?.marketName || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (shopName.trim().length < 2 || ownerName.trim().length < 2 || !state || !marketName) {
      return Alert.alert('Missing info', 'Please fill all the fields.');
    }
    setSaving(true);
    await updateShop({ shopName: shopName.trim(), ownerName: ownerName.trim(), state, marketName });
    setSaving(false);
    Alert.alert('Profile Updated');
    navigation.goBack();
  };

  return (
    <Screen>
      <Field label="Shop Name" value={shopName} onChangeText={setShopName} />
      <Field label="Owner Name" value={ownerName} onChangeText={setOwnerName} />
      <MarketPicker
        state={state}
        market={marketName}
        onChange={(s, m) => {
          setState(s);
          setMarket(m);
        }}
      />
      <Muted style={{ marginBottom: 16 }}>Phone number: {shop?.phone} (cannot change)</Muted>
      <Button title="Save Changes" onPress={save} loading={saving} />
    </Screen>
  );
}
