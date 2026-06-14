import { Construction } from "lucide-react";

import { Card, CardContent } from "@/components/ui/base";

/**
 * Placeholder for feature pages not yet ported. Sprint 1 ships the shell only;
 * feature surfaces land in Sprints 2–4. Keeps the build green and routes valid.
 */
export function PageStub({ title, sprint }: { title: string; sprint?: string }) {
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Construction className="size-6" />
          </div>
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            This page is part of the Next.js rebuild and will be implemented
            {sprint ? ` in ${sprint}` : " in a later sprint"}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
