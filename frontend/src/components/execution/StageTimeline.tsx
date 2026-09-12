import { StepStatusBadge } from "@/components/execution/ExecutionStatusBadge";
import type { ExecutionStep, StepStatus } from "@/lib/api/types";

const STATUS_BORDER_CLASSES: Record<StepStatus, string> = {
  pending: "border-l-neutral",
  running: "border-l-info",
  succeeded: "border-l-success",
  failed: "border-l-danger",
  retrying: "border-l-warning",
  skipped: "border-l-neutral",
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "–";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

interface StageTimelineProps {
  steps: ExecutionStep[];
}

export function StageTimeline({ steps }: StageTimelineProps) {
  if (steps.length === 0) {
    return <p className="py-4 text-[0.85rem] text-muted">No steps yet.</p>;
  }

  return (
    <ol className="m-0 flex list-none flex-col gap-[0.6rem] p-0">
      {steps.map((step) => (
        <li
          key={`${step.stage_key}-${step.attempt}`}
          className={`rounded-md border border-l-[3px] border-border bg-surface-alt px-[0.8rem] py-[0.6rem] ${STATUS_BORDER_CLASSES[step.status]}`}
        >
          <div className="flex items-center gap-[0.6rem] text-[0.88rem]">
            <span className="w-[1.4em] font-mono text-muted">{step.stage_order + 1}</span>
            <span className="flex-1 font-semibold">{step.stage_key}</span>
            <StepStatusBadge status={step.status} />
            {step.attempt > 1 && (
              <span className="text-[0.75rem] text-muted">attempt {step.attempt}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-4 text-[0.75rem] text-muted">
            <span>duration: {formatDuration(step.duration_ms)}</span>
            {step.started_at && (
              <span>started: {new Date(step.started_at).toLocaleTimeString()}</span>
            )}
            {step.finished_at && (
              <span>finished: {new Date(step.finished_at).toLocaleTimeString()}</span>
            )}
          </div>
          {step.error_message && (
            <div className="mt-1.5 font-mono text-[0.8rem] text-danger">{step.error_message}</div>
          )}
        </li>
      ))}
    </ol>
  );
}
