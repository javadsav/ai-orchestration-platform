"use client";

import { useEffect, useRef } from "react";
import type { ExecutionLog } from "@/lib/api/types";

interface LogPanelProps {
  logs: ExecutionLog[];
}

const LEVEL_CLASSES: Record<ExecutionLog["level"], string> = {
  debug: "text-neutral",
  info: "text-info",
  warning: "text-warning",
  error: "text-danger",
};

export function LogPanel({ logs }: LogPanelProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: "end" });
  }, [logs.length]);

  return (
    <div className="flex max-h-105 flex-col gap-[0.15rem] overflow-y-auto rounded-md bg-code px-3 py-[0.6rem] font-mono text-[0.78rem]">
      {logs.length === 0 && <p className="py-4 text-[0.85rem] text-muted">No logs yet.</p>}
      {logs.map((log) => (
        <div key={log.id} className="flex gap-[0.6rem] wrap-break-word whitespace-pre-wrap">
          <span className="shrink-0 text-muted">{new Date(log.created_at).toLocaleTimeString()}</span>
          <span className={`w-[4.5em] shrink-0 ${LEVEL_CLASSES[log.level]}`}>
            {log.level.toUpperCase()}
          </span>
          <span className="text-ink">{log.message}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
