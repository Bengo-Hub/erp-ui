"use client";

import { useCallback, useState } from "react";

export type PositionErrorKind = "unsupported" | "insecure" | "denied" | "unavailable" | "timeout";

export interface Fix {
  lat: number;
  lng: number;
  accuracyM: number;
  at: number;
}

export const POSITION_MESSAGES: Record<PositionErrorKind, string> = {
  unsupported: "This browser cannot share your location. Use the installed app or another browser.",
  insecure: "Location only works over a secure (https) connection.",
  denied: "Location is blocked for this site. Allow location for this site in your browser or phone settings, then try again.",
  unavailable: "Your location could not be found. Turn on GPS or move near a window, then try again.",
  timeout: "Finding your location took too long. Check that GPS is on and try again.",
};

/**
 * One-shot, high-accuracy location read, asked for only when the person taps (never on page
 * load, so the permission prompt has a clear reason). Resolves with the fix or null.
 */
export function useCurrentPosition(timeoutMs = 20_000) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [error, setError] = useState<PositionErrorKind | null>(null);
  const [locating, setLocating] = useState(false);

  const locate = useCallback((): Promise<Fix | null> => {
    setError(null);
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setError("unsupported");
      return Promise.resolve(null);
    }
    if (!window.isSecureContext) {
      setError("insecure");
      return Promise.resolve(null);
    }
    setLocating(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const next = { lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: p.coords.accuracy, at: p.timestamp };
          setFix(next);
          setLocating(false);
          resolve(next);
        },
        (e) => {
          setError(e.code === e.PERMISSION_DENIED ? "denied" : e.code === e.TIMEOUT ? "timeout" : "unavailable");
          setLocating(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
      );
    });
  }, [timeoutMs]);

  return { fix, error, locating, locate, message: error ? POSITION_MESSAGES[error] : null };
}
