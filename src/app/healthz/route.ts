import { NextResponse } from "next/server";

/** Liveness/readiness probe used by Docker/k8s and the e2e smoke test. */
export function GET() {
  return NextResponse.json(
    { status: "healthy", service: "erp-ui", time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
