"use client";

import { useEffect, useRef } from "react";
import type { ExecutionLog } from "@/lib/api/types";

interface LogPanelProps {
  logs: ExecutionLog[];
}

export function LogPanel({ logs }: LogPanelProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: "end" });
  }, [logs.length]);

  return (
    <div className="log-panel">
      {logs.length === 0 && <p className="table-empty">No logs yet.</p>}
      {logs.map((log) => (
        <div key={log.id} className={`log-line log-${log.level}`}>
          <span className="log-time">{new Date(log.created_at).toLocaleTimeString()}</span>
          <span className={`log-level log-level-${log.level}`}>{log.level.toUpperCase()}</span>
          <span className="log-message">{log.message}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
