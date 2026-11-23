"use client";

import { Camera, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/base";
import { downscaleImage } from "@/lib/image-resize";

/**
 * Front-camera photo for a clock-in. On a phone the input opens the camera directly; elsewhere it
 * falls back to a file picker. The photo is downscaled before it is handed back.
 */
export function PhotoCapture({ value, onChange }: { value: Blob | null; onChange: (photo: Blob | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);
  // Free the previous object URL when the photo changes or the card unmounts.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    onChange(await downscaleImage(file));
  };

  return (
    <div className="flex items-center gap-3">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a remote image
        <img src={preview} alt="Your clock-in photo" className="size-14 rounded-lg object-cover" />
      ) : (
        <div className="flex size-14 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
          <Camera className="size-5" />
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        aria-label="Take a clock-in photo"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button type="button" variant="outline" className="min-h-11" onClick={() => input.current?.click()}>
        {preview ? <RotateCcw className="mr-2 size-4" aria-hidden /> : <Camera className="mr-2 size-4" aria-hidden />}
        {preview ? "Retake photo" : "Take photo"}
      </Button>
    </div>
  );
}
