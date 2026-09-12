import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Table } from "@/components/ui/Table";
import { ExecutionStatusBadge } from "@/components/execution/ExecutionStatusBadge";
import { listWorkflows } from "@/lib/api/workflows";
import { listExecutions } from "@/lib/api/executions";
import type { Execution, ExecutionStatus } from "@/lib/api/types";

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

export default async function DashboardPage() {
  let error: string | null = null;
  let workflowTotal = 0;
  let executions: Execution[] = [];
  let executionTotal = 0;

  try {
    const [workflowPage, executionPage] = await Promise.all([
      listWorkflows({ limit: 1 }),
      listExecutions({ limit: RECENT_LIMIT }),
    ]);
    workflowTotal = workflowPage.total;
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
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/8 px-4 py-3 text-[0.85rem] text-danger">
          {error}
        </div>
      )}

      {!error && (
        <>
          <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
            <StatTile label="Workflows" value={workflowTotal} />
            <StatTile label="Total Executions" value={executionTotal} />
            <StatTile label="Running" value={statusCounts.running} />
            <StatTile label="Succeeded (recent)" value={statusCounts.succeeded} />
            <StatTile label="Failed (recent)" value={statusCounts.failed} />
            <StatTile label="Retrying" value={statusCounts.retrying} />
          </div>

          <Card title="Recent Executions">
            <Table
              rows={executions}
              rowKey={(row) => row.id}
              emptyMessage="No executions yet."
              columns={[
                {
                  key: "id",
                  header: "Execution",
                  render: (row) => (
                    <Link href={`/executions/${row.id}`}>{row.id.slice(0, 8)}</Link>
                  ),
                },
                {
                  key: "workflow",
                  header: "Workflow",
                  render: (row) => (
                    <Link href={`/workflows/${row.workflow_id}`}>
                      {row.workflow_id.slice(0, 8)}
                    </Link>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <ExecutionStatusBadge status={row.status} />,
                },
                {
                  key: "created_at",
                  header: "Created",
                  render: (row) => new Date(row.created_at).toLocaleString(),
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}
