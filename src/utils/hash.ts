import * as Crypto from 'expo-crypto';

/** Local PIN hash. The raw PIN is never stored on the phone. */
export const hashPin = (pin: string, salt: string): Promise<string> =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `shopbook:${salt}:${pin}`);
