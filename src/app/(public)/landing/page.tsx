import Link from "next/link";

/** Public marketing/landing entry. Unauthenticated and tenant-agnostic. */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-accent/10 p-6 text-center">
      <div className="size-16 rounded-2xl bg-primary flex items-center justify-center">
        <span className="text-2xl font-black text-primary-foreground">B</span>
      </div>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Codevertex ERP</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          HR and internal operations for the Codevertex platform — payroll, leave,
          attendance, appraisals and reporting.
        </p>
      </div>
      <Link
        href="/codevertex"
        className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
      >
        Go to your workspace
      </Link>
    </div>
  );
}
