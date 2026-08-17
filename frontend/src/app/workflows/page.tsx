import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { listWorkflows } from "@/lib/api/workflows";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  let error: string | null = null;
  let workflows: Awaited<ReturnType<typeof listWorkflows>>["items"] = [];

  try {
    const page = await listWorkflows({ limit: 100 });
    workflows = page.items;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load workflows.";
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Workflows</h1>
          <p className="page-subtitle">All defined workflow pipelines.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {!error && (
        <Card>
          <Table
            rows={workflows}
            rowKey={(row) => row.id}
            emptyMessage="No workflows defined yet."
            columns={[
              {
                key: "name",
                header: "Name",
                render: (row) => <Link href={`/workflows/${row.id}`}>{row.name}</Link>,
              },
              {
                key: "description",
                header: "Description",
                render: (row) => row.description ?? "–",
              },
              {
                key: "stages",
                header: "Stages",
                render: (row) => row.stage_definitions.length,
              },
              {
                key: "is_active",
                header: "Status",
                render: (row) => (
                  <Badge tone={row.is_active ? "success" : "neutral"}>
                    {row.is_active ? "active" : "inactive"}
                  </Badge>
                ),
              },
              {
                key: "created_at",
                header: "Created",
                render: (row) => new Date(row.created_at).toLocaleString(),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
