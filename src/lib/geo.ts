/**
 * Geo helpers for the clock-in card's local preview. erp-api decides inside or outside with the
 * shared httpware geo package; this only tells the employee where they stand before they tap.
 * The distance and ring math comes from @bengo-hub/maps, never a local copy.
 */

import { haversineDistance, pointInRing } from "@bengo-hub/maps/utils";

import { type WorkSite } from "@/lib/api/work-sites";

/** Great-circle distance in metres. */
export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  return haversineDistance({ latitude: aLat, longitude: aLng }, { latitude: bLat, longitude: bLng }) * 1000;
}

export interface NearestSite {
  site: WorkSite;
  distanceM: number;
  inside: boolean;
}

/** The closest active site to a point, with whether the point is inside its fence. */
export function nearestSite(lat: number, lng: number, sites: WorkSite[], toleranceM = 0): NearestSite | null {
  let best: NearestSite | null = null;
  for (const site of sites) {
    if (!site.active) continue;
    const distanceM = haversineMeters(lat, lng, site.center.lat, site.center.lng);
    const inside =
      site.ring && site.ring.length >= 3
        ? pointInRing({ latitude: lat, longitude: lng }, site.ring)
        : distanceM <= site.radius_m + toleranceM;
    if (!best || (inside && !best.inside) || (inside === best.inside && distanceM < best.distanceM)) {
      best = { site, distanceM, inside };
    }
  }
  return best;
}

/** "45 m" or "1.2 km". */
export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
