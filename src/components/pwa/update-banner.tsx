"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Detects a waiting service worker (a new app build) and offers a one-tap
 * reload. Mirrors the platform PWA update pattern: on `updatefound` we watch the
 * installing worker; once it's `installed` while one already controls the page,
 * a new version is ready. Clicking "Update" tells it to skipWaiting and reloads.
 */
export function PwaUpdateBanner() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let reg: ServiceWorkerRegistration | undefined;
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;
      reg = registration;
      // A new worker may already be waiting from a prior visit.
      if (registration.waiting && navigator.serviceWorker.controller) {
        setWaiting(registration.waiting);
      }
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(installing);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      reg = undefined;
    };
  }, []);

  if (!waiting) return null;

  const applyUpdate = () => {
    waiting.postMessage({ type: "SKIP_WAITING" });
    // Fallback in case the worker doesn't honor the message (workbox skipWaiting
    // is already enabled, so controllerchange usually fires first).
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[95] flex flex-wrap items-center justify-center gap-3 border-t border-border bg-card px-4 py-3 text-sm shadow-lg"
    >
      <span className="font-medium text-foreground">A new version is available.</span>
      <button
        type="button"
        onClick={applyUpdate}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RefreshCw className="size-3.5" aria-hidden />
        Update
      </button>
    </div>
  );
}
