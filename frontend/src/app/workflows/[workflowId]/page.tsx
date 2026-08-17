import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { ExecutionStatusBadge } from "@/components/execution/ExecutionStatusBadge";
import { TriggerExecutionButton } from "@/components/execution/TriggerExecutionButton";
import { getWorkflow } from "@/lib/api/workflows";
import { listExecutions } from "@/lib/api/executions";
import { ApiError } from "@/lib/api/client";
import type { Execution, Workflow } from "@/lib/api/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ workflowId: string }>;
}

export default async function WorkflowDetailPage({ params }: PageProps) {
  const { workflowId } = await params;

  let workflow: Workflow;
  try {
    workflow = await getWorkflow(workflowId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    return (
      <div className="error-box">
        {err instanceof Error ? err.message : "Failed to load workflow."}
      </div>
    );
  }

  let executions: Execution[] = [];
  let executionsError: string | null = null;
  try {
    const page = await listExecutions({ workflow_id: workflowId, limit: 50 });
    executions = page.items;
  } catch (err) {
    executionsError = err instanceof Error ? err.message : "Failed to load executions.";
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{workflow.name}</h1>
          <p className="page-subtitle">{workflow.description ?? "No description."}</p>
        </div>
        <TriggerExecutionButton workflowId={workflow.id} />
      </div>

      <Card title="Stages">
        <ol className="stage-def-list">
          {workflow.stage_definitions.map((stage) => (
            <li key={stage.key} className="stage-def-item">
              <strong>{stage.label}</strong>
              <span className="stage-def-meta">
                ({stage.key}) · failure rate {(stage.failure_rate * 100).toFixed(0)}% ·{" "}
                {stage.min_duration_ms}–{stage.max_duration_ms}ms
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Executions">
        {executionsError && <div className="error-box">{executionsError}</div>}
        {!executionsError && (
          <Table
            rows={executions}
            rowKey={(row) => row.id}
            emptyMessage="No executions for this workflow yet."
            columns={[
              {
                key: "id",
                header: "Execution",
                render: (row) => (
                  <Link href={`/executions/${row.id}`}>{row.id.slice(0, 8)}</Link>
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
        )}
      </Card>
    </div>
  );
}
