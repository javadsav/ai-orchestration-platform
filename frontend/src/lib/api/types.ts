export interface StageDefinition {
  key: string;
  label: string;
  failure_rate: number;
  min_duration_ms: number;
  max_duration_ms: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  stage_definitions: StageDefinition[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ExecutionStatus =
  | "pending"
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "retrying"
  | "cancelled";

export interface Execution {
  id: string;
  workflow_id: string;
  status: ExecutionStatus;
  celery_task_id: string | null;
  input_payload: Record<string, unknown> | null;
  result_payload: Record<string, unknown> | null;
  error_message: string | null;
  queued_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StepStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "retrying"
  | "skipped";

export interface ExecutionStep {
  id: string;
  stage_key: string;
  stage_order: number;
  status: StepStatus;
  attempt: number;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  output_payload: Record<string, unknown> | null;
  error_message: string | null;
}

export type LogLevel = "debug" | "info" | "warning" | "error";

export interface ExecutionLog {
  id: number;
  execution_step_id: string | null;
  level: LogLevel;
  message: string;
  created_at: string;
}

export interface ExecutionDetail extends Execution {
  steps: ExecutionStep[];
  logs: ExecutionLog[];
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface HealthStatus {
  status: "ok";
}

export interface ReadyChecks {
  database: string;
  redis: string;
  broker: string;
}

export interface ReadyStatus {
  status: "ok" | "degraded";
  checks: ReadyChecks;
}

export interface QueueEvent {
  id: string;
  execution_id: string;
  event_type: string;
  queue_name: string;
  worker_hostname: string;
  created_at: string;
}

export interface QueueStatus {
  workers: string[];
  active_tasks: Record<string, unknown>;
  reserved_tasks: Record<string, unknown>;
  scheduled_tasks: Record<string, unknown>;
  recent_events: QueueEvent[];
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  stage_definitions: StageDefinition[];
  is_active?: boolean;
}

export interface CreateExecutionInput {
  input_payload?: Record<string, unknown>;
}
