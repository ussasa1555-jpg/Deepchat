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

export function useEncryption(roomId: string) {
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [keyVersion, setKeyVersion] = useState<number>(1);

  useEffect(() => {
    // Load or generate encryption key for this room with rotation support
    const storageKey = `deepchat_room_key_${roomId}`;
    
    const loadOrGenerateKey = () => {
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const metadata: KeyMetadata = JSON.parse(stored);
          
          // Check if key expired (30 days)
          if (Date.now() > metadata.expiresAt) {
            console.log('[ENCRYPTION] Key expired, rotating...');
            return generateNewKey();
          }
          
          // Key still valid
          setKeyVersion(metadata.version);
          return metadata.key;
        } catch (error) {
          // Legacy format (just a string), migrate to new format
          console.log('[ENCRYPTION] Migrating to new key format...');
          const metadata: KeyMetadata = {
            key: stored,
            createdAt: Date.now(),
            expiresAt: Date.now() + KEY_LIFETIME,
            version: 1
          };
          localStorage.setItem(storageKey, JSON.stringify(metadata));
          setKeyVersion(1);
          return stored;
        }
      }
      
      return generateNewKey();
    };
    
    const generateNewKey = () => {
      const newKey = generateRoomKey();
      const version = keyVersion + 1;
      const metadata: KeyMetadata = {
        key: newKey,
        createdAt: Date.now(),
        expiresAt: Date.now() + KEY_LIFETIME,
        version
      };
      localStorage.setItem(storageKey, JSON.stringify(metadata));
      setKeyVersion(version);
      console.log(`[ENCRYPTION] New key generated (v${version})`);
      return newKey;
    };
    
    const key = loadOrGenerateKey();
    setEncryptionKey(key);
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
      // Verify HMAC signature if present
      if (hmac) {
        const isValid = await verifyMessage(encrypted, hmac, encryptionKey);
        if (!isValid) {
          console.error('[SECURITY] HMAC verification failed - message may be tampered!');
          return '[MESSAGE_TAMPERED]';
        }
      }
      
      return await decryptMessage(encrypted, salt, iv, encryptionKey);
    } catch (error) {
      console.error('Decryption error:', error);
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


