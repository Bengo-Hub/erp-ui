"use client";

import { type ZoneGeometry } from "@bengo-hub/maps";
import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Switch } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/states";
import { useOutletOptions } from "@/hooks/use-option-hooks";
import { useSaveWorkSite } from "@/hooks/use-work-sites";
import { type WorkSite, type WorkSiteInput } from "@/lib/api/work-sites";
import { haversineMeters } from "@/lib/geo";
import { cn } from "@/lib/utils";

const WorkSiteMap = dynamic(() => import("@/components/attendance/work-site-map").then((m) => m.WorkSiteMap), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full sm:h-96" />,
});

const DEFAULT_RADIUS = 100;

function toGeometry(site: WorkSite | null): ZoneGeometry {
  if (!site) return { shape: "circle", center: null, radiusM: DEFAULT_RADIUS, boundary: [] };
  const polygon = !!site.ring && site.ring.length >= 3;
  return {
    shape: polygon ? "polygon" : "circle",
    center: { latitude: site.center.lat, longitude: site.center.lng },
    radiusM: site.radius_m || DEFAULT_RADIUS,
    boundary: polygon ? (site.ring as number[][]) : [],
  };
}

/** A polygon still needs a centre and radius on the wire: the vertex average and farthest vertex. */
function toWire(g: ZoneGeometry): Pick<WorkSiteInput, "center" | "radius_m" | "ring"> | null {
  if (g.shape === "polygon") {
    if (g.boundary.length < 3) return null;
    const lng = g.boundary.reduce((s, p) => s + p[0], 0) / g.boundary.length;
    const lat = g.boundary.reduce((s, p) => s + p[1], 0) / g.boundary.length;
    const radius = Math.max(...g.boundary.map((p) => haversineMeters(lat, lng, p[1], p[0])));
    return { center: { lat, lng }, radius_m: Math.ceil(radius), ring: g.boundary };
  }
  if (!g.center) return null;
  return { center: { lat: g.center.latitude, lng: g.center.longitude }, radius_m: Math.round(g.radiusM), ring: null };
}

/** Add or edit a work site: name, branch, and a fence drawn on the map as a circle or a polygon. */
export function SiteFormDialog({
  site,
  sites,
  onClose,
}: {
  site: WorkSite | null;
  sites: WorkSite[];
  onClose: () => void;
}) {
  const [name, setName] = useState(site?.name ?? "");
  const [outletId, setOutletId] = useState(site?.outlet_id ?? "");
  const [active, setActive] = useState(site?.active ?? true);
  const [geometry, setGeometry] = useState<ZoneGeometry>(() => toGeometry(site));
  const outlets = useOutletOptions();
  const save = useSaveWorkSite();
  const wire = toWire(geometry);
  const valid = !!name.trim() && !!wire;

  const setShape = (shape: ZoneGeometry["shape"]) => setGeometry((g) => ({ ...g, shape }));

  const submit = () => {
    if (!valid || !wire) return;
    save.mutate(
      { id: site?.id, data: { name: name.trim(), outlet_id: outletId || null, active, ...wire } },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={site ? `Edit ${site.name}` : "Add work site"}
      maxWidth="max-w-4xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!valid || save.isPending}>
            {save.isPending ? "Saving" : "Save work site"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name" htmlFor="site-name" required>
            <Input id="site-name" value={name} placeholder="e.g. Factory floor" onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Branch" htmlFor="site-outlet">
            <Combobox
              id="site-outlet"
              value={outletId}
              onChange={setOutletId}
              options={outlets.options}
              loading={outlets.isLoading}
              placeholder="Optional"
              clearable
            />
          </Field>
          <Field label="Fence shape" htmlFor="site-shape">
            <div id="site-shape" role="radiogroup" className="flex rounded-lg border border-input p-0.5">
              {(["circle", "polygon"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={geometry.shape === s}
                  onClick={() => setShape(s)}
                  className={cn(
                    "min-h-9 flex-1 rounded-md text-sm font-medium",
                    geometry.shape === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {s === "circle" ? "Circle" : "Outline"}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <WorkSiteMap value={geometry} onChange={setGeometry} sites={sites} editingId={site?.id} />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="max-w-xl text-xs text-muted-foreground">
            {geometry.shape === "circle"
              ? "Tap the map to place the centre, then drag the edge handle or type the radius."
              : "Tap the map to add corners. Drag a corner to move it; double-click a corner to remove it."}
          </p>
          {geometry.shape === "circle" && (
            <Field label="Radius (metres)" htmlFor="site-radius" className="w-36">
              <Input
                id="site-radius"
                type="number"
                min={10}
                step={10}
                value={Math.round(geometry.radiusM)}
                onChange={(e) => setGeometry((g) => ({ ...g, radiusM: Math.max(10, Number(e.target.value) || 0) }))}
              />
            </Field>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
          <span className="text-sm font-medium text-foreground">Use this site for clock-in</span>
          <Switch id="site-active" checked={active} onChange={setActive} />
        </div>
      </div>
    </Dialog>
  );
}
