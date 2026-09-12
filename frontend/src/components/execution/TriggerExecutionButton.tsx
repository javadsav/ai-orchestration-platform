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
      <button
        className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-[0.85rem] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleClick}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Triggering…" : "Trigger Execution"}
      </button>
      {error && (
        <p className="mt-2.5 rounded-md border border-danger/40 bg-danger/8 px-4 py-3 text-[0.85rem] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
