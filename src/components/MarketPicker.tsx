import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { MarketAPI } from '../api/client';
import { OTHERS, SEED_MARKETS, STATES } from '../data/nigeria';
import { storage } from '../storage/storage';
import { colors } from '../theme';
import { SelectField } from './SelectModal';
import { Button, Field } from './ui';

/** 3-step market selection: State -> Market (search) -> "+ Add My Market". No Google Maps. */
export function MarketPicker({
  state,
  market,
  onChange,
  errors,
}: {
  state: string;
  market: string;
  onChange: (state: string, market: string) => void;
  errors?: { state?: string; market?: string };
}) {
  const [markets, setMarkets] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [newMarket, setNewMarket] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!state) return setMarkets([]);
    let alive = true;
    (async () => {
      const cache = await storage.getCachedMarkets();
      const local = Array.from(new Set([...(SEED_MARKETS[state] || []), ...(cache[state] || [])]));
      if (alive) setMarkets([...local.filter((m) => m !== OTHERS), OTHERS]);
      try {
        const remote = await MarketAPI.list(state);
        const merged = Array.from(new Set([...local, ...remote])).filter((m) => m !== OTHERS);
        await storage.setCachedMarkets({ ...cache, [state]: merged });
        if (alive) setMarkets([...merged, OTHERS]);
      } catch {
        /* offline: keep local list */
      }
    })();
    return () => {
      alive = false;
    };
  }, [state]);

  const saveNewMarket = async (close?: () => void) => {
    const name = newMarket.trim().replace(/\s+/g, ' ');
    if (name.length < 2) return Alert.alert('Market name', 'Please type your market name.');
    setSaving(true);
    const cache = await storage.getCachedMarkets();
    await storage.setCachedMarkets({ ...cache, [state]: Array.from(new Set([...(cache[state] || []), name])) });
    MarketAPI.add(state, name).catch(() => {}); // backend also saves it when the shop registers
    setMarkets((m) => Array.from(new Set([name, ...m])));
    onChange(state, name);
    setSaving(false);
    setAdding(false);
    setNewMarket('');
    close?.();
  };

  return (
    <View>
      <SelectField
        label="1. Your State"
        placeholder="Choose your state"
        value={state}
        options={STATES}
        onSelect={(s) => onChange(s, '')}
        error={errors?.state}
      />
      <SelectField
        label="2. Your Market"
        placeholder={state ? 'Choose your market' : 'Choose state first'}
        value={market}
        options={markets}
        disabled={!state}
        error={errors?.market}
        onSelect={(m) => {
          if (m === OTHERS) {
            setAdding(true);
            onChange(state, '');
          } else onChange(state, m);
        }}
        footer={(close, q) => (
          <Button
            variant="outline"
            title="+ Add My Market"
            onPress={() => {
              setNewMarket(q);
              setAdding(true);
              close();
            }}
          />
        )}
      />
      {!adding && state ? (
        <Text onPress={() => setAdding(true)} style={{ color: colors.primary, fontSize: 16, fontWeight: '700', marginTop: -8, marginBottom: 16 }}>
          + Add My Market
        </Text>
      ) : null}
      {adding && (
        <View style={{ marginBottom: 8 }}>
          <Field label="3. Type your market name" value={newMarket} onChangeText={setNewMarket} placeholder="e.g. Ikot Ekpene Market" />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <Button title="Save Market" onPress={() => saveNewMarket()} loading={saving} style={{ flex: 1 }} />
            <Button title="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </View>
  );
}
