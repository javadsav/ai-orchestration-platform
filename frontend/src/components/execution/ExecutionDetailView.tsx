"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ExecutionStatusBadge } from "@/components/execution/ExecutionStatusBadge";
import { StageTimeline } from "@/components/execution/StageTimeline";
import { LogPanel } from "@/components/execution/LogPanel";
import { useExecutionSocket } from "@/lib/ws/useExecutionSocket";

const TERMINAL_STATUSES = new Set(["succeeded", "failed", "cancelled"]);

export function ExecutionDetailView({ executionId }: { executionId: string }) {
  const state = useExecutionSocket(executionId);
  const isTerminal = state.status !== null && TERMINAL_STATUSES.has(state.status);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Execution {executionId.slice(0, 8)}</h1>
          {state.workflow_id && (
            <p className="page-subtitle">
              Workflow:{" "}
              <Link href={`/workflows/${state.workflow_id}`}>{state.workflow_id.slice(0, 8)}</Link>
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          <span className={`connection-indicator connection-${state.connectionState}`}>
            <span className="connection-dot" />
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
          {state.error_message && <div className="error-box">{state.error_message}</div>}
          {state.result_payload && (
            <pre className="result-block">{JSON.stringify(state.result_payload, null, 2)}</pre>
          )}
          {!state.error_message && !state.result_payload && (
            <p className="table-empty">No result payload.</p>
          )}
        </Card>
      )}
    </div>
  );
}
