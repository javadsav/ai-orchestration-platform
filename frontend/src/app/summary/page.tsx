import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Table } from "@/components/ui/Table";
import { ExecutionStatusBadge } from "@/components/execution/ExecutionStatusBadge";
import type { ExecutionStatus } from "@/lib/api/types";

const STAT_CARDS = [
  { label: "Total Workflows", value: 12, hint: "3 added this week" },
  { label: "Total Executions", value: 1842, hint: "+128 since yesterday" },
  { label: "Success Rate", value: "94.2%", hint: "Last 7 days" },
  { label: "Avg Duration", value: "3.4s", hint: "Across all stages" },
  { label: "Active Workers", value: 4, hint: "All healthy" },
  { label: "Failed Today", value: 7, hint: "0.9% of today's runs" },
];

const STATUS_BREAKDOWN: { status: ExecutionStatus; count: number; barClass: string }[] = [
  { status: "succeeded", count: 1524, barClass: "bg-success" },
  { status: "failed", count: 63, barClass: "bg-danger" },
  { status: "running", count: 18, barClass: "bg-info" },
  { status: "retrying", count: 9, barClass: "bg-warning" },
  { status: "queued", count: 5, barClass: "bg-neutral" },
  { status: "cancelled", count: 12, barClass: "bg-neutral" },
];
const STATUS_TOTAL = STATUS_BREAKDOWN.reduce((sum, row) => sum + row.count, 0);

interface TopWorkflow {
  name: string;
  executions: number;
  successRate: number;
}

const TOP_WORKFLOWS: TopWorkflow[] = [
  { name: "Image Classification Pipeline", executions: 412, successRate: 97 },
  { name: "Document OCR Extraction", executions: 356, successRate: 91 },
  { name: "Sentiment Analysis Batch", executions: 298, successRate: 95 },
  { name: "Video Transcoding", executions: 210, successRate: 88 },
  { name: "Fraud Detection Scoring", executions: 189, successRate: 99 },
];

interface RecentActivity {
  id: string;
  workflow: string;
  status: ExecutionStatus;
  duration: string;
  time: string;
}

const RECENT_ACTIVITY: RecentActivity[] = [
  { id: "a1b2c3d4", workflow: "Image Classification Pipeline", status: "succeeded", duration: "2.1s", time: "2 min ago" },
  { id: "e5f6g7h8", workflow: "Document OCR Extraction", status: "running", duration: "–", time: "4 min ago" },
  { id: "i9j0k1l2", workflow: "Fraud Detection Scoring", status: "failed", duration: "0.8s", time: "9 min ago" },
  { id: "m3n4o5p6", workflow: "Sentiment Analysis Batch", status: "succeeded", duration: "1.4s", time: "15 min ago" },
  { id: "q7r8s9t0", workflow: "Video Transcoding", status: "retrying", duration: "5.6s", time: "22 min ago" },
];

export default function SummaryPage() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1>Summary</h1>
          <p className="text-[0.85rem] text-muted">
            High-level overview of platform activity. Placeholder data — not wired up yet.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        {STAT_CARDS.map((stat) => (
          <StatTile key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} />
        ))}
      </div>

      <Card title="Executions by Status">
        <div className="flex flex-col gap-2.5">
          {STATUS_BREAKDOWN.map((row) => {
            const pct = STATUS_TOTAL === 0 ? 0 : (row.count / STATUS_TOTAL) * 100;
            return (
              <div key={row.status} className="flex items-center gap-3 text-[0.85rem]">
                <span className="w-24 shrink-0 capitalize text-muted">{row.status}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-alt">
                  <div className={`h-full rounded-full ${row.barClass}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-12 shrink-0 text-right text-muted">{row.count}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Top Workflows">
        <Table
          rows={TOP_WORKFLOWS}
          rowKey={(row) => row.name}
          columns={[
            { key: "name", header: "Workflow", render: (row) => row.name },
            { key: "executions", header: "Executions", render: (row) => row.executions },
            {
              key: "successRate",
              header: "Success Rate",
              render: (row) => `${row.successRate}%`,
            },
          ]}
        />
      </Card>

      <Card title="Recent Activity">
        <Table
          rows={RECENT_ACTIVITY}
          rowKey={(row) => row.id}
          columns={[
            { key: "id", header: "Execution", render: (row) => row.id.slice(0, 8) },
            { key: "workflow", header: "Workflow", render: (row) => row.workflow },
            {
              key: "status",
              header: "Status",
              render: (row) => <ExecutionStatusBadge status={row.status} />,
            },
            { key: "duration", header: "Duration", render: (row) => row.duration },
            { key: "time", header: "Time", render: (row) => row.time },
          ]}
        />
      </Card>
    </div>
  );
}
