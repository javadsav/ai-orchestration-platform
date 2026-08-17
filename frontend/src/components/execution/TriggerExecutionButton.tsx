"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { triggerExecution } from "@/lib/api/executions";

export function TriggerExecutionButton({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setError(null);
    try {
      const execution = await triggerExecution(workflowId);
      router.push(`/executions/${execution.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger execution.");
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <button className="button" onClick={handleClick} disabled={isSubmitting}>
        {isSubmitting ? "Triggering…" : "Trigger Execution"}
      </button>
      {error && <p className="error-box" style={{ marginTop: "0.6rem" }}>{error}</p>}
    </div>
  );
}
