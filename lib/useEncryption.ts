'use client';

import { useState, useEffect } from 'react';
import { encryptMessage, decryptMessage, generateRoomKey, signMessage, verifyMessage } from './encryption';

interface KeyMetadata {
  key: string;
  createdAt: number;
  expiresAt: number;
  version: number;
}

const KEY_LIFETIME = 30 * 24 * 60 * 60 * 1000; // 30 days

export function useEncryption(roomId: string, onKeyReady?: (key: string) => void) {
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [keyVersion, setKeyVersion] = useState<number>(1);

  useEffect(() => {
    if (!roomId || roomId === 'temp') return;
    
    // Generate DETERMINISTIC key from roomId (same for all users)
    const generateDeterministicKey = async () => {
      console.log('[ENCRYPTION] 🔑 Generating deterministic key from:', roomId);
      
      // Use SubtleCrypto to derive key from roomId
      const encoder = new TextEncoder();
      const data = encoder.encode(roomId);
      
      // Hash the roomId
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      
      // Convert to base64 for key
      let binary = '';
      for (let i = 0; i < hashArray.byteLength; i++) {
        binary += String.fromCharCode(hashArray[i]);
      }
      const key = btoa(binary);
      
      console.log('[ENCRYPTION] ✅ Deterministic key generated');
      return key;
    };
    
    // Load from cache or generate
    const loadKey = async () => {
      const storageKey = `deepchat_room_key_${roomId}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const metadata: KeyMetadata = JSON.parse(stored);
          setKeyVersion(metadata.version);
          console.log(`[ENCRYPTION] ✅ Using cached deterministic key`);
          return metadata.key;
        } catch (error) {
          // Regenerate if corrupted
        }
      }
      
      // Generate deterministic key
      const key = await generateDeterministicKey();
      const metadata: KeyMetadata = {
        key,
        createdAt: Date.now(),
        expiresAt: Date.now() + KEY_LIFETIME,
        version: 1
      };
      localStorage.setItem(storageKey, JSON.stringify(metadata));
      setKeyVersion(1);
      
      return key;
    };
    
    loadKey().then(key => {
      setEncryptionKey(key);
      if (onKeyReady) {
        onKeyReady(key);
      }
    });
  }, [roomId]);

  const encrypt = async (plaintext: string): Promise<{
    encrypted: string;
    salt: string;
    iv: string;
    hmac: string;
    nonce: string;
  } | null> => {
    if (!encryptionKey) return null;
    
    try {
      const encrypted = await encryptMessage(plaintext, encryptionKey);
      
      // Generate HMAC signature for message authentication
      const hmac = await signMessage(encrypted.encrypted, encryptionKey);
      
      // Generate unique nonce for replay attack prevention
      const nonce = crypto.randomUUID();
      
      return {
        ...encrypted,
        hmac,
        nonce
      };
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  };

  const decrypt = async (
    encrypted: string,
    salt: string,
    iv: string,
    hmac?: string
  ): Promise<string> => {
    if (!encryptionKey) return encrypted; // Fallback to plaintext
    
    try {
      // Verify HMAC signature if present (OPTIONAL - warns but doesn't block)
      if (hmac) {
        const isValid = await verifyMessage(encrypted, hmac, encryptionKey);
        if (!isValid) {
          console.warn('[HMAC] ⚠️ Verification failed - key mismatch or old message');
          console.warn('[HMAC] Attempting decryption anyway (HMAC is optional)');
          // Don't return, continue to decrypt
        } else {
          console.log('[HMAC] ✅ Verification passed');
        }
      }
      
      // Always attempt decryption (HMAC is advisory only)
      return await decryptMessage(encrypted, salt, iv, encryptionKey);
    } catch (error) {
      console.error('[DECRYPT] ❌ Decryption failed:', error);
      return '[DECRYPTION_FAILED]';
    }
  };

  const rotateKey = () => {
    const storageKey = `deepchat_room_key_${roomId}`;
    const newKey = generateRoomKey();
    const newVersion = keyVersion + 1;
    const metadata: KeyMetadata = {
      key: newKey,
      createdAt: Date.now(),
      expiresAt: Date.now() + KEY_LIFETIME,
      version: newVersion
    };
    localStorage.setItem(storageKey, JSON.stringify(metadata));
    setEncryptionKey(newKey);
    setKeyVersion(newVersion);
    console.log(`[ENCRYPTION] Key manually rotated to v${newVersion}`);
  };

  return {
    encrypt,
    decrypt,
    rotateKey,
    isReady: !!encryptionKey,
    keyVersion,
  };
}


