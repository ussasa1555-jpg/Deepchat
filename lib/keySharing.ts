/**
 * Multi-Device Key Sharing and Synchronization
 * Allows secure key transfer between devices via QR codes
 */

/**
 * Prepare encryption key for sharing
 * Includes key, version, and expiration data
 */
export interface ShareableKey {
  roomId: string;
  key: string;
  version: number;
  expiresAt: number;
  sharedAt: number;
}

/**
 * Generate QR-friendly key data
 * Format: deepchat://key?data=<base64>
 */
export function generateShareableKeyData(shareableKey: ShareableKey): string {
  const json = JSON.stringify(shareableKey);
  const base64 = btoa(json);
  return `deepchat://key?data=${base64}`;
}

/**
 * Parse shared key data from QR code
 */
export function parseSharedKeyData(data: string): ShareableKey | null {
  try {
    if (!data.startsWith('deepchat://key?data=')) {
      throw new Error('Invalid key format');
    }

    const base64 = data.replace('deepchat://key?data=', '');
    const json = atob(base64);
    const parsed = JSON.parse(json) as ShareableKey;

    // Validate required fields
    if (!parsed.roomId || !parsed.key || !parsed.version) {
      throw new Error('Missing required fields');
    }

    // Check if key has expired (24 hour share window)
    const shareAge = Date.now() - parsed.sharedAt;
    const MAX_SHARE_AGE = 24 * 60 * 60 * 1000; // 24 hours

    if (shareAge > MAX_SHARE_AGE) {
      throw new Error('Shared key has expired');
    }

    return parsed;
  } catch (error) {
    console.error('[KEY_SHARE] Parse error:', error);
    return null;
  }
}

/**
 * Import shared key into local storage
 */
export function importSharedKey(shareableKey: ShareableKey): boolean {
  try {
    const storageKey = `deepchat_room_key_${shareableKey.roomId}`;

    const metadata = {
      key: shareableKey.key,
      createdAt: Date.now(),
      expiresAt: shareableKey.expiresAt,
      version: shareableKey.version,
    };

    localStorage.setItem(storageKey, JSON.stringify(metadata));
    console.log(`[KEY_SHARE] Imported key v${shareableKey.version} for room ${shareableKey.roomId}`);
    return true;
  } catch (error) {
    console.error('[KEY_SHARE] Import error:', error);
    return false;
  }
}

/**
 * Validate device authorization
 * Check if device is allowed to receive keys
 */
export interface DeviceAuthorization {
  deviceId: string;
  deviceName: string;
  authorizedAt: number;
  authorizedBy: string; // UID
}

/**
 * Store device authorization
 */
export function authorizeDevice(auth: DeviceAuthorization): void {
  const key = 'deepchat_authorized_devices';
  const stored = localStorage.getItem(key);
  const devices: DeviceAuthorization[] = stored ? JSON.parse(stored) : [];

  // Add new device
  devices.push(auth);

  // Keep only last 5 devices
  const limited = devices.slice(-5);

  localStorage.setItem(key, JSON.stringify(limited));
  console.log(`[KEY_SHARE] Device ${auth.deviceName} authorized`);
}

/**
 * Get authorized devices
 */
export function getAuthorizedDevices(): DeviceAuthorization[] {
  const key = 'deepchat_authorized_devices';
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Revoke device authorization
 */
export function revokeDeviceAuthorization(deviceId: string): void {
  const key = 'deepchat_authorized_devices';
  const stored = localStorage.getItem(key);
  if (!stored) return;

  const devices: DeviceAuthorization[] = JSON.parse(stored);
  const filtered = devices.filter((d) => d.deviceId !== deviceId);

  localStorage.setItem(key, JSON.stringify(filtered));
  console.log(`[KEY_SHARE] Device ${deviceId} revoked`);
}





