"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Table } from "@/components/ui/Table";
import { getQueueStatus } from "@/lib/api/system";
import type { QueueStatus } from "@/lib/api/types";

const POLL_INTERVAL_MS = 5000;

export default function QueuePage() {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await getQueueStatus();
        if (!cancelled) {
          setStatus(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load queue status.");
        }
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const activeCount = status ? Object.keys(status.active_tasks).length : 0;
  const reservedCount = status ? Object.keys(status.reserved_tasks).length : 0;
  const scheduledCount = status ? Object.keys(status.scheduled_tasks).length : 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1>Queue Monitor</h1>
          <p className="text-[0.85rem] text-muted">
            Celery worker and task queue status (polling every 5s).
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/8 px-4 py-3 text-[0.85rem] text-danger">
          {error}
        </div>
      )}

      {status && (
        <>
          <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
            <StatTile label="Workers" value={status.workers.length} />
            <StatTile label="Active Tasks" value={activeCount} />
            <StatTile label="Reserved Tasks" value={reservedCount} />
            <StatTile label="Scheduled Tasks" value={scheduledCount} />
          </div>

          <Card title="Workers">
            {status.workers.length === 0 ? (
              <p className="py-4 text-[0.85rem] text-muted">No workers online.</p>
            ) : (
              <ul>
                {status.workers.map((worker) => (
                  <li key={worker}>{worker}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Recent Events">
            <Table
              rows={status.recent_events}
              rowKey={(row) => row.id}
              emptyMessage="No recent queue events."
              columns={[
                { key: "event_type", header: "Event", render: (row) => row.event_type },
                { key: "queue_name", header: "Queue", render: (row) => row.queue_name },
                { key: "execution_id", header: "Execution", render: (row) => row.execution_id.slice(0, 8) },
                { key: "worker_hostname", header: "Worker", render: (row) => row.worker_hostname },
                {
                  key: "created_at",
                  header: "Time",
                  render: (row) => new Date(row.created_at).toLocaleTimeString(),
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}
