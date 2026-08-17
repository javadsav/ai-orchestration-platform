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
      <div className="page-header">
        <div>
          <h1>System Health</h1>
          <p className="page-subtitle">Live readiness of backend dependencies.</p>
        </div>
        {ready && (
          <Badge tone={ready.status === "ok" ? "success" : "warning"}>{ready.status}</Badge>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}

      {ready && (
        <Card title="Dependencies">
          <div className="health-grid">
            {Object.entries(ready.checks).map(([name, value]) => (
              <div className="health-item" key={name}>
                <span className="health-item-label">{name}</span>
                <Badge tone={toneFor(String(value))}>{String(value)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
