/**
 * End-to-End Encryption Utilities
 * Simple AES-GCM encryption for messages
 */

/**
 * Generate encryption key from password
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt message
 */
export async function encryptMessage(
  message: string,
  password: string
): Promise<{ encrypted: string; salt: string; iv: string }> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(message)
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypt message
 */
export async function decryptMessage(
  encryptedData: string,
  salt: string,
  iv: string,
  password: string
): Promise<string> {
  const decoder = new TextDecoder();
  const saltArray = base64ToArrayBuffer(salt);
  const ivArray = base64ToArrayBuffer(iv);
  const encrypted = base64ToArrayBuffer(encryptedData);
  
  const key = await deriveKey(password, new Uint8Array(saltArray));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivArray },
    key,
    encrypted
  );

  return decoder.decode(decrypted);
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate random room encryption key
 */
export function generateRoomKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return arrayBufferToBase64(array);
}

/**
 * Generate HMAC signature for message authentication
 */
export async function signMessage(
  message: string,
  key: string
): Promise<string> {
  const encoder = new TextEncoder();
  
  // Import key for HMAC
  const keyData = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Generate signature
  const signature = await crypto.subtle.sign(
    'HMAC',
    keyData,
    encoder.encode(message)
  );
  
  return arrayBufferToBase64(signature);
}

/**
 * Verify HMAC signature for message authentication
 */
export async function verifyMessage(
  message: string,
  signature: string,
  key: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    
    // Import key for HMAC
    const keyData = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Verify signature
    const isValid = await crypto.subtle.verify(
      'HMAC',
      keyData,
      base64ToArrayBuffer(signature),
      encoder.encode(message)
    );
    
    return isValid;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}



