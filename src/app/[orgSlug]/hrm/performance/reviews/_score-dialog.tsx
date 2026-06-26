"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form";
import {
  usePerformanceMetrics,
  useReviewMetrics,
  useUpsertReviewMetric,
} from "@/hooks/use-performance";
import { normalizeList } from "@/lib/api/drf";
import {
  type PerformanceMetric,
  type PerformanceReview,
  type ReviewMetric,
} from "@/lib/api/performance";

type ScoreRow = { value: string; rating: string; comments: string };

/** Score a review against the defined metrics — one upsert per metric row. */
export function ReviewScoreDialog({
  review,
  onClose,
}: {
  review: PerformanceReview;
  onClose: () => void;
}) {
  const { data: metricData, isLoading: metricsLoading } = usePerformanceMetrics({ page_size: 200 });
  const { data: scoreData, isLoading: scoresLoading } = useReviewMetrics(review.id);
  const upsert = useUpsertReviewMetric(review.id);

  const metrics = normalizeList<PerformanceMetric>(metricData).results;
  const scores = normalizeList<ReviewMetric>(scoreData).results;

  const existing = useMemo(() => {
    const m = new Map<string, ReviewMetric>();
    for (const s of scores) if (s.metric_id) m.set(s.metric_id, s);
    return m;
  }, [scores]);

  const [edits, setEdits] = useState<Record<string, ScoreRow>>({});
  const rowFor = (metricId: string): ScoreRow => {
    if (edits[metricId]) return edits[metricId];
    const e = existing.get(metricId);
    return { value: e?.value != null ? String(e.value) : "", rating: e?.rating != null ? String(e.rating) : "", comments: e?.comments ?? "" };
  };
  const setRow = (metricId: string, patch: Partial<ScoreRow>) =>
    setEdits((prev) => ({ ...prev, [metricId]: { ...rowFor(metricId), ...patch } }));

  return (
    <Dialog
      open
      onClose={onClose}
      title="Score Review"
      description={`Metrics for ${review.employee_name || "this review"}`}
      maxWidth="max-w-3xl"
      footer={<Button variant="outline" size="sm" onClick={onClose}>Close</Button>}
    >
      {metricsLoading || scoresLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading metrics…</p>
      ) : metrics.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No metrics defined. Add metrics under Performance → Metrics first.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_2fr_auto] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Metric</span><span>Value</span><span>Rating</span><span>Comments</span><span />
          </div>
          {metrics.map((m) => {
            const row = rowFor(m.id);
            const saved = existing.has(m.id);
            return (
              <div key={m.id} className="grid grid-cols-[1.5fr_1fr_1fr_2fr_auto] items-center gap-2 rounded-lg border border-border px-2 py-1.5">
                <span className="text-sm font-medium">
                  {m.name}
                  {m.unit ? <span className="text-muted-foreground"> ({m.unit})</span> : null}
                </span>
                <Input type="number" value={row.value} onChange={(e) => setRow(m.id, { value: e.target.value })} />
                <Input type="number" step="0.5" value={row.rating} onChange={(e) => setRow(m.id, { rating: e.target.value })} />
                <Input value={row.comments} onChange={(e) => setRow(m.id, { comments: e.target.value })} />
                <Button
                  size="sm"
                  variant={saved ? "outline" : "primary"}
                  disabled={upsert.isPending || (!row.value && !row.rating)}
                  onClick={() =>
                    upsert.mutate({ metric_id: m.id, value: row.value, rating: row.rating, comments: row.comments })
                  }
                >
                  <Check className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Dialog>
  );
}
