import { apiFetch } from "@/lib/api/client";
import type {
  CreateExecutionInput,
  Execution,
  ExecutionDetail,
  ExecutionStatus,
  Page,
} from "@/lib/api/types";

export function listExecutions(
  params: {
    workflow_id?: string;
    status?: ExecutionStatus;
    limit?: number;
    offset?: number;
  } = {},
) {
  return apiFetch<Page<Execution>>("/executions", { query: params });
}

export function getExecution(executionId: string) {
  return apiFetch<ExecutionDetail>(`/executions/${executionId}`);
}

export function triggerExecution(workflowId: string, input: CreateExecutionInput = {}) {
  return apiFetch<Execution>(`/workflows/${workflowId}/executions`, {
    method: "POST",
    body: input,
  });
}
