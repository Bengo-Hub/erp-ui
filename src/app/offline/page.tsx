import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

/** Offline shell — served by the service worker when a navigation fails with no network. */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WifiOff className="size-7" aria-hidden />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">You&apos;re offline</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This page isn&apos;t available without a connection. Reconnect and try again — your
          cached pages stay usable.
        </p>
      </div>
    </div>
  );
}
