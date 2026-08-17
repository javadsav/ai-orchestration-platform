"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { clientWsBaseUrl } from "@/lib/config";
import type {
  Execution,
  ExecutionDetail,
  ExecutionLog,
  ExecutionStatus,
  ExecutionStep,
} from "@/lib/api/types";

const TERMINAL_STATUSES: ExecutionStatus[] = ["succeeded", "failed", "cancelled"];

export interface ExecutionSocketState {
  status: ExecutionStatus | null;
  workflow_id: string | null;
  execution: Execution | null;
  steps: ExecutionStep[];
  logs: ExecutionLog[];
  result_payload: Record<string, unknown> | null;
  error_message: string | null;
  connectionState: "connecting" | "open" | "closed";
}

type IncomingMessage =
  | { type: "snapshot"; execution: ExecutionDetail }
  | { type: "execution_update"; execution: Execution }
  | { type: "step_update"; step: ExecutionStep }
  | { type: "log"; log: ExecutionLog };

const MAX_RECONNECT_DELAY_MS = 15000;
const BASE_RECONNECT_DELAY_MS = 500;

function mergeSteps(existing: ExecutionStep[], incoming: ExecutionStep): ExecutionStep[] {
  const idx = existing.findIndex(
    (s) => s.stage_key === incoming.stage_key && s.attempt === incoming.attempt,
  );
  if (idx === -1) {
    return [...existing, incoming].sort((a, b) => a.stage_order - b.stage_order);
  }
  const next = existing.slice();
  next[idx] = incoming;
  return next.sort((a, b) => a.stage_order - b.stage_order);
}

/**
 * Opens a WebSocket to /ws/executions/{executionId}, keeping local state in sync
 * with the live stream of execution/step/log updates. Automatically reconnects
 * with exponential backoff while the execution is still in a non-terminal state.
 */
export function useExecutionSocket(executionId: string): ExecutionSocketState {
  const [state, setState] = useState<ExecutionSocketState>({
    status: null,
    workflow_id: null,
    execution: null,
    steps: [],
    logs: [],
    result_payload: null,
    error_message: null,
    connectionState: "connecting",
  });

  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const closedForGoodRef = useRef(false);

  const applyMessage = useCallback((message: IncomingMessage) => {
    setState((prev) => {
      switch (message.type) {
        case "snapshot": {
          const { steps, logs, ...execution } = message.execution;
          return {
            ...prev,
            status: execution.status,
            workflow_id: execution.workflow_id,
            execution,
            steps: [...steps].sort((a, b) => a.stage_order - b.stage_order),
            logs,
            result_payload: execution.result_payload,
            error_message: execution.error_message,
          };
        }
        case "execution_update": {
          const execution = message.execution;
          return {
            ...prev,
            status: execution.status,
            workflow_id: execution.workflow_id,
            execution,
            result_payload: execution.result_payload,
            error_message: execution.error_message,
          };
        }
        case "step_update": {
          return {
            ...prev,
            steps: mergeSteps(prev.steps, message.step),
          };
        }
        case "log": {
          return {
            ...prev,
            logs: [...prev.logs, message.log],
          };
        }
        default:
          return prev;
      }
    });
  }, []);

  useEffect(() => {
    closedForGoodRef.current = false;
    reconnectAttempt.current = 0;

    function connect() {
      if (closedForGoodRef.current) return;

      const base = clientWsBaseUrl.replace(/\/$/, "");
      const url = `${base}/ws/executions/${executionId}`;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      setState((prev) => ({ ...prev, connectionState: "connecting" }));

      socket.onopen = () => {
        reconnectAttempt.current = 0;
        setState((prev) => ({ ...prev, connectionState: "open" }));
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as IncomingMessage;
          applyMessage(parsed);
        } catch {
          // ignore malformed messages
        }
      };

      socket.onclose = () => {
        setState((prev) => ({ ...prev, connectionState: "closed" }));

        setState((prev) => {
          const isTerminal = prev.status !== null && TERMINAL_STATUSES.includes(prev.status);
          if (isTerminal || closedForGoodRef.current) {
            closedForGoodRef.current = true;
            return prev;
          }

          const attempt = reconnectAttempt.current;
          const delay = Math.min(
            BASE_RECONNECT_DELAY_MS * 2 ** attempt,
            MAX_RECONNECT_DELAY_MS,
          );
          reconnectAttempt.current += 1;
          reconnectTimer.current = setTimeout(connect, delay);
          return prev;
        });
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connect();

    return () => {
      closedForGoodRef.current = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      socketRef.current?.close();
    };
  }, [executionId, applyMessage]);

  return state;
}
