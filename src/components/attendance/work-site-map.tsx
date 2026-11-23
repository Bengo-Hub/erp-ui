"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { MapProvider, ZoneEditor, circlePolygon, type ZoneGeometry, type ZoneShape } from "@bengo-hub/maps";

import { resolveApiBaseUrl } from "@/lib/api/client";
import { type WorkSite } from "@/lib/api/work-sites";

// This module touches window and WebGL; pages load it with next/dynamic (ssr: false).

/** Platform tile server unless the deployment points at its own. */
const TILE_SERVER_URL = process.env.NEXT_PUBLIC_TILE_SERVER_URL ?? "https://tiles.codevertexafrica.com";

/** Other sites drawn faintly so a new fence does not overlap them by accident. */
function contextShapes(sites: WorkSite[], editingId?: string): ZoneShape[] {
  return sites
    .filter((s) => s.id !== editingId)
    .map((s) => ({
      id: s.id,
      name: s.name,
      boundary:
        s.ring && s.ring.length >= 3
          ? s.ring
          : circlePolygon({ latitude: s.center.lat, longitude: s.center.lng }, s.radius_m),
      muted: true,
    }));
}

export function WorkSiteMap({
  value,
  onChange,
  sites,
  editingId,
}: {
  value: ZoneGeometry;
  onChange: (next: ZoneGeometry) => void;
  sites: WorkSite[];
  editingId?: string;
}) {
  const first = sites.find((s) => s.id !== editingId);
  return (
    <MapProvider tileServerUrl={TILE_SERVER_URL} apiBaseUrl={`${resolveApiBaseUrl().replace(/\/$/, "")}/api/v1`}>
      <ZoneEditor
        value={value}
        onChange={onChange}
        otherZones={contextShapes(sites, editingId)}
        defaultCenter={first ? { latitude: first.center.lat, longitude: first.center.lng } : undefined}
        className="h-80 w-full overflow-hidden rounded-lg border border-border sm:h-96"
      />
    </MapProvider>
  );
}
