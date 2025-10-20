'use client';

import { useEffect, useRef, useCallback } from 'react';

// Terminal beep sound as base64 data URL (classic PC beep)
const BEEP_SOUND = 'data:audio/wav;base64,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';

interface SoundSettings {
  enabled: boolean;
}

const STORAGE_KEY = 'deepchat_sound_settings';

export function useSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const settingsRef = useRef<SoundSettings>({ enabled: true });

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio(BEEP_SOUND);
    audioRef.current.volume = 0.3; // 30% volume

    // Load settings from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          settingsRef.current = JSON.parse(stored);
        }
      } catch (err) {
        console.error('Failed to load sound settings:', err);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotification = useCallback(() => {
    if (!settingsRef.current.enabled) return;
    
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.warn('Audio playback failed:', err);
        });
      }
    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  }, []);

  const toggleSound = useCallback((enabled: boolean) => {
    settingsRef.current.enabled = enabled;
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsRef.current));
      } catch (err) {
        console.error('Failed to save sound settings:', err);
      }
    }
  }, []);

  const isSoundEnabled = useCallback(() => {
    return settingsRef.current.enabled;
  }, []);

  return {
    playNotification,
    toggleSound,
    isSoundEnabled,
  };
}










