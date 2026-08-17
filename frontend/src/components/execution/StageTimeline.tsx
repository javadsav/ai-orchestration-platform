import { StepStatusBadge } from "@/components/execution/ExecutionStatusBadge";
import type { ExecutionStep } from "@/lib/api/types";

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
    return <p className="table-empty">No steps yet.</p>;
  }

  return (
    <ol className="stage-timeline">
      {steps.map((step) => (
        <li key={`${step.stage_key}-${step.attempt}`} className={`stage-item stage-${step.status}`}>
          <div className="stage-item-header">
            <span className="stage-order">{step.stage_order + 1}</span>
            <span className="stage-key">{step.stage_key}</span>
            <StepStatusBadge status={step.status} />
            {step.attempt > 1 && <span className="stage-attempt">attempt {step.attempt}</span>}
          </div>
          <div className="stage-item-meta">
            <span>duration: {formatDuration(step.duration_ms)}</span>
            {step.started_at && (
              <span>started: {new Date(step.started_at).toLocaleTimeString()}</span>
            )}
            {step.finished_at && (
              <span>finished: {new Date(step.finished_at).toLocaleTimeString()}</span>
            )}
          </div>
          {step.error_message && <div className="stage-error">{step.error_message}</div>}
        </li>
      ))}
    </ol>
  );
}
