"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createWorkflow } from "@/lib/api/workflows";
import type { StageDefinition } from "@/lib/api/types";

const DESCRIPTION_MAX = 500;

interface StepDraft {
  uid: number;
  label: string;
  failure_rate: number;
  min_duration_ms: number;
  max_duration_ms: number;
  open: boolean;
}

let nextUid = 1;

function newStep(label = ""): StepDraft {
  return {
    uid: nextUid++,
    label,
    failure_rate: 0,
    min_duration_ms: 300,
    max_duration_ms: 1200,
    open: label === "",
  };
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toStageDefinitions(steps: StepDraft[]): StageDefinition[] {
  const used = new Map<string, number>();
  return steps.map((s) => {
    const base = slugify(s.label) || "step";
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    return {
      key: count === 1 ? base : `${base}_${count}`,
      label: s.label.trim(),
      failure_rate: s.failure_rate,
      min_duration_ms: s.min_duration_ms,
      max_duration_ms: s.max_duration_ms,
    };
  });
}

const inputClass =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-[0.85rem] text-ink placeholder:text-muted focus:border-accent focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.8rem] font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-surface">
      <h2 className="m-0 border-b border-border px-4 py-3.5 text-[0.95rem] font-semibold">
        {title}
      </h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function CreateWorkflowForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<StepDraft[]>([newStep()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateStep(uid: number, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((s) => (s.uid === uid ? { ...s, ...patch } : s)));
  }

  function moveStep(index: number, delta: -1 | 1) {
    setSteps((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function validate(): string | null {
    if (!name.trim()) return "Workflow name is required.";
    if (steps.length === 0) return "Add at least one step.";
    for (const [i, s] of steps.entries()) {
      if (!s.label.trim()) return `Step ${i + 1} needs a name.`;
      if (s.min_duration_ms > s.max_duration_ms) {
        return `Step ${i + 1}: min duration cannot exceed max duration.`;
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const workflow = await createWorkflow({
        name: name.trim(),
        description: description.trim() || undefined,
        stage_definitions: toStageDefinitions(steps),
        is_active: isActive,
      });
      router.push(`/workflows/${workflow.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workflow.");
      setSubmitting(false);
    }
  }

  const previewSteps = steps.filter((s) => s.label.trim());

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-ink no-underline hover:border-accent hover:no-underline"
        >
          ←
        </Link>
        <div>
          <h1 className="m-0">Create New Workflow</h1>
          <p className="text-[0.85rem] text-muted">
            Define a workflow and configure its execution steps.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-md border border-danger/40 bg-danger/8 px-4 py-3 text-[0.85rem] text-danger">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Panel title="Workflow Details">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Workflow Name">
                <input
                  className={inputClass}
                  placeholder="e.g. Order Processing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  autoFocus
                />
              </Field>
              <div>
                <span className="mb-1.5 block text-[0.8rem] font-medium text-ink">
                  Active workflow
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    isActive ? "bg-accent" : "bg-neutral"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                      isActive ? "left-5.5" : "left-0.5"
                    }`}
                  />
                </button>
                <p className="mt-2 text-[0.78rem] text-muted">
                  {isActive
                    ? "The workflow will be available for execution once created."
                    : "The workflow will be created inactive."}
                </p>
              </div>
              <div className="md:col-span-2">
                <Field label="Description">
                  <div className="relative">
                    <textarea
                      className={`${inputClass} h-24 resize-none`}
                      placeholder="What does this workflow do?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
                    />
                    <span className="absolute bottom-2 right-3 text-[0.7rem] text-muted">
                      {description.length}/{DESCRIPTION_MAX}
                    </span>
                  </div>
                </Field>
              </div>
            </div>
          </Panel>

          <Panel title="Workflow Steps">
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {steps.map((step, i) => (
                <li key={step.uid} className="rounded-md border border-border bg-surface-alt">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[0.75rem] font-semibold text-white">
                      {i + 1}
                    </span>
                    <input
                      className={inputClass}
                      placeholder="Step name, e.g. Validate Order"
                      value={step.label}
                      onChange={(e) => updateStep(step.uid, { label: e.target.value })}
                    />
                    <div className="flex shrink-0 items-center gap-1 text-muted">
                      <button
                        type="button"
                        title="Move up"
                        disabled={i === 0}
                        onClick={() => moveStep(i, -1)}
                        className="rounded px-1.5 py-1 hover:text-ink disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        title="Move down"
                        disabled={i === steps.length - 1}
                        onClick={() => moveStep(i, 1)}
                        className="rounded px-1.5 py-1 hover:text-ink disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        title="Configure"
                        aria-expanded={step.open}
                        onClick={() => updateStep(step.uid, { open: !step.open })}
                        className={`rounded px-1.5 py-1 hover:text-ink ${
                          step.open ? "rotate-90" : ""
                        }`}
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        title="Remove step"
                        disabled={steps.length === 1}
                        onClick={() => setSteps((prev) => prev.filter((s) => s.uid !== step.uid))}
                        className="rounded px-1.5 py-1 hover:text-danger disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {step.open && (
                    <div className="grid gap-3 border-t border-border px-3 py-3 sm:grid-cols-3">
                      <Field label="Failure rate (0–1)">
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          className={inputClass}
                          value={step.failure_rate}
                          onChange={(e) =>
                            updateStep(step.uid, {
                              failure_rate: Math.min(1, Math.max(0, Number(e.target.value) || 0)),
                            })
                          }
                        />
                      </Field>
                      <Field label="Min duration (ms)">
                        <input
                          type="number"
                          min={0}
                          step={100}
                          className={inputClass}
                          value={step.min_duration_ms}
                          onChange={(e) =>
                            updateStep(step.uid, {
                              min_duration_ms: Math.max(0, Math.trunc(Number(e.target.value) || 0)),
                            })
                          }
                        />
                      </Field>
                      <Field label="Max duration (ms)">
                        <input
                          type="number"
                          min={0}
                          step={100}
                          className={inputClass}
                          value={step.max_duration_ms}
                          onChange={(e) =>
                            updateStep(step.uid, {
                              max_duration_ms: Math.max(0, Math.trunc(Number(e.target.value) || 0)),
                            })
                          }
                        />
                      </Field>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setSteps((prev) => [...prev, newStep()])}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-accent px-3.5 py-2 text-[0.85rem] font-semibold text-accent hover:bg-accent/10"
            >
              <span className="text-base leading-none">+</span> Add Step
            </button>
          </Panel>
        </div>

        <div>
          <Panel title="Workflow Preview">
            {previewSteps.length === 0 ? (
              <p className="m-0 text-[0.85rem] text-muted">
                Name your steps to see the execution flow.
              </p>
            ) : (
              <ol className="m-0 flex list-none flex-wrap items-start gap-y-4 p-0">
                {previewSteps.map((s, i) => (
                  <li key={s.uid} className="flex items-center">
                    <div className="flex w-24 flex-col items-center gap-2 text-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent bg-accent/10 text-[0.85rem] font-semibold text-accent">
                        {i + 1}
                      </span>
                      <span className="text-[0.75rem] leading-tight text-ink">{s.label}</span>
                    </div>
                    {i < previewSteps.length - 1 && (
                      <span className="mb-6 text-muted">→</span>
                    )}
                  </li>
                ))}
              </ol>
            )}
            <p className="mb-0 mt-4 border-t border-border pt-3 text-[0.78rem] text-muted">
              Steps run sequentially in the order shown.
            </p>
          </Panel>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
        <Link
          href="/"
          className="rounded-md border border-border bg-surface px-4 py-2 text-[0.85rem] font-semibold text-ink no-underline hover:no-underline"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-4 py-2 text-[0.85rem] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create Workflow"}
        </button>
      </div>
    </form>
  );
}
