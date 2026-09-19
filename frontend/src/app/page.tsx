import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Table } from "@/components/ui/Table";
import { ActiveWorkflowPanel } from "@/components/execution/ActiveWorkflowPanel";
import { WorkflowAvatar } from "@/components/execution/WorkflowAvatar";
import { listWorkflows } from "@/lib/api/workflows";
import { listExecutions } from "@/lib/api/executions";
import type { Execution, ExecutionStatus, Workflow } from "@/lib/api/types";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 10;

function countByStatus(executions: Execution[]): Record<ExecutionStatus, number> {
  const counts: Record<ExecutionStatus, number> = {
    pending: 0,
    queued: 0,
    running: 0,
    succeeded: 0,
    failed: 0,
    retrying: 0,
    cancelled: 0,
  };
  for (const execution of executions) {
    counts[execution.status] += 1;
  }
  return counts;
}

function formatDuration(execution: Execution): string {
  if (!execution.started_at) return "–";
  const start = new Date(execution.started_at).getTime();
  const end = execution.finished_at ? new Date(execution.finished_at).getTime() : Date.now();
  const ms = end - start;
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const STATUS_STYLES: Record<ExecutionStatus, { dot: string; text: string; label: string }> = {
  pending: { dot: "bg-neutral", text: "text-neutral", label: "Pending" },
  queued: { dot: "bg-info", text: "text-info", label: "Queued" },
  running: { dot: "bg-info", text: "text-info", label: "Running" },
  succeeded: { dot: "bg-success", text: "text-success", label: "Success" },
  failed: { dot: "bg-danger", text: "text-danger", label: "Failed" },
  retrying: { dot: "bg-warning", text: "text-warning", label: "Retrying" },
  cancelled: { dot: "bg-neutral", text: "text-neutral", label: "Cancelled" },
};

function StatusDot({ status }: { status: ExecutionStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[0.8rem] font-medium ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default async function DashboardPage() {
  let error: string | null = null;
  let workflowTotal = 0;
  let executions: Execution[] = [];
  let executionTotal = 0;
  let workflowsById = new Map<string, Workflow>();

  try {
    const [workflowPage, executionPage] = await Promise.all([
      listWorkflows({ limit: 100 }),
      listExecutions({ limit: RECENT_LIMIT }),
    ]);
    workflowTotal = workflowPage.total;
    workflowsById = new Map(workflowPage.items.map((w) => [w.id, w]));
    executions = executionPage.items;
    executionTotal = executionPage.total;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load dashboard data.";
  }

  const statusCounts = countByStatus(executions);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1>Dashboard</h1>
          <p className="text-[0.85rem] text-muted">
            Overview of workflows and recent execution activity.
          </p>
        </div>
        <Link
          href="/workflows/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-[0.85rem] font-semibold text-white hover:opacity-90"
        >
          <span className="text-base leading-none">+</span> New Workflow
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/8 px-4 py-3 text-[0.85rem] text-danger">
          {error}
        </div>
      )}

      {!error && (
        <>
          <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
            <StatTile label="Workflowsss" value={workflowTotal} />
            <StatTile label="Total Executions" value={executionTotal} />
            <StatTile label="Running" value={statusCounts.running} />
            <StatTile label="Succeeded (recent)" value={statusCounts.succeeded} />
            <StatTile label="Failed (recent)" value={statusCounts.failed} />
            <StatTile label="Retrying" value={statusCounts.retrying} />
          </div>

          <Card
            title={
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Active Workflow
              </span>
            }
            actions={
              <div className="flex items-center gap-2">
                <Badge tone="success">Running</Badge>
                <span className="text-sm text-muted">Started 2 minutes ago</span>
              </div>
            }
          >
            <ActiveWorkflowPanel />
          </Card>
          <Card
            title="Recent Executions"
            actions={
              <Link
                href="/executions"
                className="inline-flex items-center gap-1 text-[0.8rem] font-medium text-accent hover:underline"
              >
                View all <span aria-hidden>→</span>
              </Link>
            }
          >
            <Table
              rows={executions}
              rowKey={(row) => row.id}
              emptyMessage="No executions yet."
              columns={[
                {
                  key: "workflow",
                  header: "Workflow",
                  render: (row) => {
                    const workflow = workflowsById.get(row.workflow_id);
                    return (
                      <Link href={`/workflows/${row.workflow_id}`} className="flex items-center gap-2.5">
                        <WorkflowAvatar workflowId={row.workflow_id} name={workflow?.name ?? row.workflow_id} />
                        <span className="text-ink">{workflow?.name ?? row.workflow_id.slice(0, 8)}</span>
                      </Link>
                    );
                  },
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusDot status={row.status} />,
                },
                {
                  key: "duration",
                  header: "Duration",
                  render: (row) => formatDuration(row),
                },
                {
                  key: "started_at",
                  header: "Started",
                  render: (row) => formatDateTime(row.started_at),
                },
                {
                  key: "finished_at",
                  header: "Finished",
                  render: (row) => formatDateTime(row.finished_at),
                },
                {
                  key: "actions",
                  header: "",
                  render: () => (
                    <button type="button" className="px-2 text-muted hover:text-ink" aria-label="Row actions">
                      ⋯
                    </button>
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}
