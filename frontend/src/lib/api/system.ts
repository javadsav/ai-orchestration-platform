import { apiFetch } from "@/lib/api/client";
import type { HealthStatus, QueueStatus, ReadyStatus } from "@/lib/api/types";

export function getHealth() {
  return apiFetch<HealthStatus>("/health");
}

export function getReadiness() {
  return apiFetch<ReadyStatus>("/health/ready");
}

export function getQueueStatus() {
  return apiFetch<QueueStatus>("/queue/status");
}
