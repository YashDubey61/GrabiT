"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SOUND_URL = "/sounds/new-order.mp3";
const RING_PAUSE_MS = 1200;
const UNLOCK_STORAGE_KEY = "grabit_vendor_sound_unlocked";

/**
 * Zomato/Swiggy-style incoming-order ring: play the alert clip, pause
 * briefly, repeat — until stop() is called. Handles the browser autoplay
 * restriction by requiring one real user gesture (unlock()) before any
 * sound is allowed to play; that gesture is remembered per-browser via
 * localStorage so the vendor isn't re-prompted every visit.
 */
function readStoredUnlockState(): boolean {
  try {
    return localStorage.getItem(UNLOCK_STORAGE_KEY) === "1";
  } catch {
    // localStorage unavailable (e.g. private mode) — fall back to
    // requiring an explicit "Enable Sound" click every session.
    return false;
  }
}

export function useOrderAlertSound() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringingRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(SOUND_URL);
    audio.preload = "auto";
    audioRef.current = audio;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsUnlocked(readStoredUnlockState());

    return () => {
      ringingRef.current = false;
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  const unlock = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // A muted, immediately-paused play() inside a real user gesture is
    // the standard browser-safe way to "prime" audio playback for later,
    // non-gesture-triggered calls (the incoming-order ring).
    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        setIsUnlocked(true);
        try {
          localStorage.setItem(UNLOCK_STORAGE_KEY, "1");
        } catch {
          // Non-fatal — just means we'll ask again next session.
        }
      })
      .catch(() => {
        audio.muted = false;
      });
  }, []);

  const stop = useCallback(() => {
    ringingRef.current = false;
    setIsRinging(false);
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const start = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isUnlocked || ringingRef.current) return;

    ringingRef.current = true;
    setIsRinging(true);

    const playOnce = () => {
      if (!ringingRef.current || !audioRef.current) return;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.error("[order-alert-sound] play() rejected:", err);
        // Playback can still fail (e.g. permission revoked mid-session);
        // stop cleanly rather than looping on a rejected promise.
        ringingRef.current = false;
        setIsRinging(false);
      });
    };

    audio.onended = () => {
      if (!ringingRef.current) return;
      pauseTimerRef.current = setTimeout(playOnce, RING_PAUSE_MS);
    };

    playOnce();
  }, [isUnlocked]);

  return { isUnlocked, isRinging, unlock, start, stop };
}
