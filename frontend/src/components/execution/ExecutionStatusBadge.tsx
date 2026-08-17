import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { ExecutionStatus, StepStatus } from "@/lib/api/types";

const EXECUTION_TONE: Record<ExecutionStatus, BadgeTone> = {
  pending: "neutral",
  queued: "info",
  running: "info",
  succeeded: "success",
  failed: "danger",
  retrying: "warning",
  cancelled: "neutral",
};

const STEP_TONE: Record<StepStatus, BadgeTone> = {
  pending: "neutral",
  running: "info",
  succeeded: "success",
  failed: "danger",
  retrying: "warning",
  skipped: "neutral",
};

export function ExecutionStatusBadge({ status }: { status: ExecutionStatus }) {
  return <Badge tone={EXECUTION_TONE[status]}>{status}</Badge>;
}

export function StepStatusBadge({ status }: { status: StepStatus }) {
  return <Badge tone={STEP_TONE[status]}>{status}</Badge>;
}
