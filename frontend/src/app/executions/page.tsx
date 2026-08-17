import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { ExecutionStatusBadge } from "@/components/execution/ExecutionStatusBadge";
import { listExecutions } from "@/lib/api/executions";
import type { Execution, ExecutionStatus } from "@/lib/api/types";

export const dynamic = "force-dynamic";

const STATUSES: ExecutionStatus[] = [
  "pending",
  "queued",
  "running",
  "succeeded",
  "failed",
  "retrying",
  "cancelled",
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ExecutionsPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const activeStatus = STATUSES.includes(status as ExecutionStatus)
    ? (status as ExecutionStatus)
    : undefined;

  let error: string | null = null;
  let executions: Execution[] = [];

  try {
    const page = await listExecutions({ status: activeStatus, limit: 100 });
    executions = page.items;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load executions.";
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Executions</h1>
          <p className="page-subtitle">All workflow execution runs.</p>
        </div>
      </div>

      <div className="filter-bar">
        <Link href="/executions" className={`filter-link ${!activeStatus ? "filter-link-active" : ""}`}>
          all
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/executions?status=${s}`}
            className={`filter-link ${activeStatus === s ? "filter-link-active" : ""}`}
          >
            {s}
          </Link>
        ))}
      </div>

      {error && <div className="error-box">{error}</div>}

      {!error && (
        <Card>
          <Table
            rows={executions}
            rowKey={(row) => row.id}
            emptyMessage="No executions match this filter."
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
              {
                key: "finished_at",
                header: "Finished",
                render: (row) => (row.finished_at ? new Date(row.finished_at).toLocaleString() : "–"),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
