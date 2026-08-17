import { apiFetch } from "@/lib/api/client";
import type { CreateWorkflowInput, Page, Workflow } from "@/lib/api/types";

export function listWorkflows(params: { limit?: number; offset?: number } = {}) {
  return apiFetch<Page<Workflow>>("/workflows", { query: params });
}

export function getWorkflow(workflowId: string) {
  return apiFetch<Workflow>(`/workflows/${workflowId}`);
}

export function createWorkflow(input: CreateWorkflowInput) {
  return apiFetch<Workflow>("/workflows", { method: "POST", body: input });
}
