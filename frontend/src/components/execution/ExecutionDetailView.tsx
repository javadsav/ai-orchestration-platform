"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ExecutionStatusBadge } from "@/components/execution/ExecutionStatusBadge";
import { StageTimeline } from "@/components/execution/StageTimeline";
import { LogPanel } from "@/components/execution/LogPanel";
import { useExecutionSocket, type ExecutionSocketState } from "@/lib/ws/useExecutionSocket";

const TERMINAL_STATUSES = new Set(["succeeded", "failed", "cancelled"]);

const CONNECTION_DOT_CLASSES: Record<ExecutionSocketState["connectionState"], string> = {
  open: "bg-success",
  connecting: "bg-warning",
  closed: "bg-danger",
};

export function ExecutionDetailView({ executionId }: { executionId: string }) {
  const state = useExecutionSocket(executionId);
  const isTerminal = state.status !== null && TERMINAL_STATUSES.has(state.status);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1>Execution {executionId.slice(0, 8)}</h1>
          {state.workflow_id && (
            <p className="text-[0.85rem] text-muted">
              Workflow:{" "}
              <Link href={`/workflows/${state.workflow_id}`}>{state.workflow_id.slice(0, 8)}</Link>
            </p>
          )}
        </div>
        <div className="flex items-center gap-[0.9rem]">
          <span className="inline-flex items-center gap-1.5 text-[0.78rem] text-muted">
            <span className={`h-2 w-2 rounded-full ${CONNECTION_DOT_CLASSES[state.connectionState]}`} />
            {state.connectionState === "open"
              ? "live"
              : state.connectionState === "connecting"
                ? "connecting…"
                : "disconnected"}
          </span>
          {state.status && <ExecutionStatusBadge status={state.status} />}
        </div>
      </div>

      <Card title="Stage Timeline">
        <StageTimeline steps={state.steps} />
      </Card>

      <Card title="Logs">
        <LogPanel logs={state.logs} />
      </Card>

      {isTerminal && (
        <Card title="Result">
          {state.error_message && (
            <div className="rounded-md border border-danger/40 bg-danger/8 px-4 py-3 text-[0.85rem] text-danger">
              {state.error_message}
            </div>
          )}
          {state.result_payload && (
            <pre className="overflow-x-auto rounded-md bg-code px-3 py-3 font-mono text-[0.8rem] wrap-break-word whitespace-pre-wrap">
              {JSON.stringify(state.result_payload, null, 2)}
            </pre>
          )}
          {!state.error_message && !state.result_payload && (
            <p className="py-4 text-[0.85rem] text-muted">No result payload.</p>
          )}
        </Card>
      )}
    </div>
  );
}
