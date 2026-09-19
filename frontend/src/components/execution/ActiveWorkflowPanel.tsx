import { Fragment, type ReactNode } from "react";

type StepStatus = "done" | "active" | "pending";

interface WorkflowStep {
  key: string;
  label: string;
  status: StepStatus;
  meta: string;
  icon: ReactNode;
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.31 3.13-6 7-6s7 2.69 7 6" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" strokeLinejoin="round" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.5" />
      <path d="M4.5 5.5v6c0 1.38 3.36 2.5 7.5 2.5s7.5-1.12 7.5-2.5v-6" />
      <path d="M4.5 11.5v6c0 1.38 3.36 2.5 7.5 2.5s7.5-1.12 7.5-2.5v-6" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 6 8.5-6" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <path d="M5 3v18" strokeLinecap="round" />
      <path d="M5 4h13l-2.5 4L18 12H5" strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

const STEPS: WorkflowStep[] = [
  { key: "receive", label: "Receive Order", status: "done", meta: "1.2s", icon: <UserIcon /> },
  { key: "validate", label: "Validate Order", status: "done", meta: "2.8s", icon: <ShieldIcon /> },
  { key: "inventory", label: "Check Inventory", status: "done", meta: "3.4s", icon: <DatabaseIcon /> },
  { key: "payment", label: "Process Payment", status: "active", meta: "Running...", icon: <CardIcon /> },
  { key: "confirmation", label: "Send Confirmation", status: "pending", meta: "Pending", icon: <MailIcon /> },
  { key: "complete", label: "Complete", status: "pending", meta: "Pending", icon: <FlagIcon /> },
];

const CIRCLE_CLASSES: Record<StepStatus, string> = {
  done: "border-success text-success bg-success/10",
  active: "border-info text-info bg-info/10",
  pending: "border-border text-muted bg-surface-alt",
};

const META_CLASSES: Record<StepStatus, string> = {
  done: "text-muted",
  active: "text-info",
  pending: "text-muted",
};

function StepCircle({ step }: { step: WorkflowStep }) {
  return (
    <div className="relative">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${CIRCLE_CLASSES[step.status]}`}
      >
        {step.icon}
      </div>
      {step.status === "done" && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success text-bg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-2.5 w-2.5">
            <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {step.status === "active" && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-info" />
      )}
    </div>
  );
}

export interface ActiveWorkflowSummary {
  name: string;
  description: string;
  workflowId: string;
  startedAt: string;
  duration: string;
  completedSteps: number;
  totalSteps: number;
}

interface ActiveWorkflowPanelProps {
  workflow?: ActiveWorkflowSummary;
}

// TODO: replace with a real "current active execution" API call once the backend exposes one.
const MOCK_WORKFLOW: ActiveWorkflowSummary = {
  name: "Order Processing",
  description: "Handles new orders from intake to confirmation.",
  workflowId: "wf_8f3a2c9e",
  startedAt: "Apr 27, 2025 14:32",
  duration: "2m 18s",
  completedSteps: 4,
  totalSteps: 6,
};

export function ActiveWorkflowPanel({ workflow = MOCK_WORKFLOW }: ActiveWorkflowPanelProps) {
  const progressPct = Math.round((workflow.completedSteps / workflow.totalSteps) * 100);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/15 text-info">
            <GridIcon />
          </div>
          <div>
            <div className="font-semibold text-ink">{workflow.name}</div>
            <div className="text-[0.8rem] text-muted">{workflow.description}</div>
          </div>
        </div>

        <div className="flex items-start overflow-x-auto">
          {STEPS.map((step, index) => (
            <Fragment key={step.key}>
              <div className="flex w-[104px] shrink-0 flex-col items-center text-center">
                <StepCircle step={step} />
                <div className="mt-2 text-[0.8rem] font-medium text-ink">{step.label}</div>
                <div className={`text-[0.72rem] ${META_CLASSES[step.status]}`}>{step.meta}</div>
              </div>
              {index < STEPS.length - 1 && (
                <div className="mt-[22px] flex h-[1px] min-w-[16px] flex-1 items-center justify-center text-muted">
                  &rarr;
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="w-full shrink-0 border-border pt-5 lg:w-[220px] lg:border-l lg:pl-6 lg:pt-0">
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className="text-[0.8rem] font-medium text-muted">Progress</span>
          <span className="text-right text-[0.75rem] leading-tight text-muted">
            {workflow.completedSteps} / {workflow.totalSteps} steps
            <br />
            {progressPct}%
          </span>
        </div>
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
          <div className="h-full rounded-full bg-info" style={{ width: `${progressPct}%` }} />
        </div>
        <dl className="flex flex-col gap-2.5 text-[0.8rem]">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Workflow ID</dt>
            <dd className="font-mono text-ink">{workflow.workflowId}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Started At</dt>
            <dd className="text-ink">{workflow.startedAt}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Duration</dt>
            <dd className="text-ink">{workflow.duration}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
