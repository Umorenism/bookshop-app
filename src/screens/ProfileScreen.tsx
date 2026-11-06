import React from 'react';
import { Alert, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { ScreenProps } from '../navigation';
import { Button, Card, Muted, Screen } from '../components/ui';
import { colors } from '../theme';
import { prettyDate } from '../utils/format';
import { hasActiveSubscription, subscriptionLabel, trialDaysLeft } from '../utils/access';

export default function ProfileScreen({ navigation }: ScreenProps<'Profile'>) {
  const { shop, logout, online, syncing, syncNow } = useApp();
  if (!shop) return null;
  const paid = hasActiveSubscription(shop);

  const Row = ({ k, v }: { k: string; v: string }) => (
    <View style={{ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Muted style={{ flex: 1 }}>{k}</Muted>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, flex: 1.4, textAlign: 'right' }}>{v}</Text>
    </View>
  );

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.white, fontSize: 30, fontWeight: '800' }}>{shop.shopName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 8, color: colors.text }}>{shop.shopName}</Text>
        <Muted>{shop.marketName}, {shop.state}</Muted>
      </View>

      <Card style={{ marginBottom: 12 }}>
        <Row k="Shop Name" v={shop.shopName} />
        <Row k="Owner Name" v={shop.ownerName} />
        <Row k="Phone" v={shop.phone} />
        <Row k="State" v={shop.state} />
        <Row k="Market" v={shop.marketName} />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Row k="Subscription" v={subscriptionLabel(shop)} />
        {paid ? (
          <Row k="Valid till" v={prettyDate(shop.subscriptionEndDate)} />
        ) : (
          <Row k="Trial days left" v={`${trialDaysLeft(shop)} day(s)`} />
        )}
        <Row k="PIN Lock" v={shop.pinHash ? 'On' : 'Off'} />
        <Row k="Sync" v={!online ? 'Offline' : syncing ? 'Syncing...' : shop.sync === 'pending' ? 'Waiting' : 'Up to date'} />
      </Card>

      <Button title={paid ? 'Renew / Change Plan' : 'Pay Now'} onPress={() => navigation.navigate('Paywall')} style={{ marginBottom: 10 }} />
      <Button title="✏️ Edit Profile" variant="outline" onPress={() => navigation.navigate('EditProfile')} style={{ marginBottom: 10 }} />
      <Button title={shop.pinHash ? '🔐 Change PIN' : '🔐 Set PIN'} variant="outline" onPress={() => navigation.navigate('PinSetup')} style={{ marginBottom: 10 }} />
      <Button title="🔄 Sync Now" variant="ghost" onPress={syncNow} loading={syncing} />
      <Button
        title="Logout"
        variant="danger"
        style={{ marginTop: 16 }}
        onPress={() =>
          Alert.alert('Logout?', 'We go try sync your records first. Anything not synced go lost. You can log back in with your phone number.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
          ])
        }
      />
    </Screen>
  );
}
