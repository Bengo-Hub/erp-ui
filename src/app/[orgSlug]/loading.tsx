import { CardsSkeleton, TableSkeleton } from "@/components/ui/states";

/** Route-transition fallback shown inside the shell while a page segment loads. */
export default function OrgLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
      <CardsSkeleton />
      <TableSkeleton />
    </div>
  );
}
