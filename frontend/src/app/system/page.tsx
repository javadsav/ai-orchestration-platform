import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getReadiness } from "@/lib/api/system";
import type { ReadyStatus } from "@/lib/api/types";

export const dynamic = "force-dynamic";

function toneFor(value: string): "success" | "danger" | "neutral" {
  const normalized = value.toLowerCase();
  if (normalized === "ok" || normalized === "up" || normalized === "healthy") return "success";
  if (normalized === "down" || normalized === "error" || normalized === "unhealthy") return "danger";
  return "neutral";
}

export default async function SystemHealthPage() {
  let ready: ReadyStatus | null = null;
  let error: string | null = null;

  try {
    ready = await getReadiness();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load system health.";
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1>System Health</h1>
          <p className="text-[0.85rem] text-muted">Live readiness of backend dependencies.</p>
        </div>
        {ready && (
          <Badge tone={ready.status === "ok" ? "success" : "warning"}>{ready.status}</Badge>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/8 px-4 py-3 text-[0.85rem] text-danger">
          {error}
        </div>
      )}

      {ready && (
        <Card title="Dependencies">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            {Object.entries(ready.checks).map(([name, value]) => (
              <div
                className="flex flex-col gap-1 rounded-md border border-border bg-surface-alt px-4 py-3"
                key={name}
              >
                <span className="text-[0.75rem] tracking-wide text-muted uppercase">{name}</span>
                <Badge tone={toneFor(String(value))}>{String(value)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
