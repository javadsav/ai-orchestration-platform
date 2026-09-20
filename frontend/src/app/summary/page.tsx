import type { ReactNode } from "react";
import Link from "next/link";
import { WorkflowAvatar } from "@/components/execution/WorkflowAvatar";
import { ExecutionStatusBadge } from "@/components/execution/ExecutionStatusBadge";
import { listWorkflows } from "@/lib/api/workflows";
import { listExecutions } from "@/lib/api/executions";
import type { Execution, Workflow } from "@/lib/api/types";

export const dynamic = "force-dynamic";

const DAYS = 7;
const DAY_MS = 86_400_000;
const PAGE_SIZE = 200;
const PAGES = 3;
const RECENT_LIMIT = 5;

/* ---------- data helpers ---------- */

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function durationMs(e: Execution): number | null {
  if (!e.started_at || !e.finished_at) return null;
  return new Date(e.finished_at).getTime() - new Date(e.started_at).getTime();
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "–";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function shortDay(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Percent change of current vs previous; null when there is no baseline. */
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/* ---------- small presentational pieces ---------- */

function Panel({
  title,
  subtitle,
  icon,
  actions,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-lg border border-border bg-surface p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {icon && <span className="mt-0.5 text-muted">{icon}</span>}
          <div>
            <h2 className="m-0 text-[1rem] font-semibold">{title}</h2>
            {subtitle && <p className="m-0 text-[0.78rem] text-muted">{subtitle}</p>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Delta({ value, goodWhenUp }: { value: number | null; goodWhenUp: boolean }) {
  if (value === null) return <span className="text-[0.78rem] text-muted">no baseline</span>;
  const up = value >= 0;
  const good = up === goodWhenUp || value === 0;
  return (
    <span className={`text-[0.8rem] font-semibold ${good ? "text-success" : "text-danger"}`}>
      {up ? "↑" : "↓"} {up ? "+" : ""}
      {Math.round(value)}%
    </span>
  );
}

type Tone = "info" | "success" | "danger";

const TONES: Record<Tone, { border: string; bg: string; text: string }> = {
  info: { border: "border-l-info", bg: "bg-info/15", text: "text-info" },
  success: { border: "border-l-success", bg: "bg-success/15", text: "text-success" },
  danger: { border: "border-l-danger", bg: "bg-danger/15", text: "text-danger" },
};

function KpiCard({
  tone,
  icon,
  label,
  value,
  sub,
  delta,
}: {
  tone: Tone;
  icon: ReactNode;
  label: string;
  value: string | number;
  sub: string;
  delta: ReactNode;
}) {
  const t = TONES[tone];
  return (
    <div className={`flex items-center gap-4 rounded-lg border border-l-4 border-border bg-surface p-5 ${t.border}`}>
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${t.bg} ${t.text}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[0.85rem] text-muted">{label}</div>
        <div className="text-[1.9rem] font-bold leading-tight">{value}</div>
        <div className="text-[0.78rem] text-muted">{sub}</div>
      </div>
      <div className="flex flex-col items-end text-right">
        {delta}
        <span className="text-[0.72rem] text-muted">vs. previous 7 days</span>
      </div>
    </div>
  );
}

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const NetworkIcon = ({ size = 26 }: { size?: number }) => (
  <svg {...svgProps} width={size} height={size}>
    <circle cx="6" cy="12" r="2.3" />
    <circle cx="17" cy="6" r="2.3" />
    <circle cx="17" cy="18" r="2.3" />
    <path d="M8.1 10.8L14.9 7.2M8.1 13.2L14.9 16.8" />
  </svg>
);
const PlayIcon = ({ size = 26 }: { size?: number }) => (
  <svg {...svgProps} width={size} height={size}>
    <path d="M8 5l11 7-11 7z" />
  </svg>
);
const CheckIcon = ({ size = 26 }: { size?: number }) => (
  <svg {...svgProps} width={size} height={size}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const CrossIcon = ({ size = 26 }: { size?: number }) => (
  <svg {...svgProps} width={size} height={size}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
const TrendIcon = () => (
  <svg {...svgProps} width={20} height={20}>
    <path d="M3 17l6-6 4 4 8-9" />
    <path d="M15 6h6v6" />
  </svg>
);
const PulseIcon = () => (
  <svg {...svgProps} width={20} height={20}>
    <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />
  </svg>
);
const ClockIcon = ({ size = 20 }: { size?: number }) => (
  <svg {...svgProps} width={size} height={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const BarsIcon = () => (
  <svg {...svgProps} width={20} height={20}>
    <path d="M6 20V11M12 20V4M18 20v-7" />
  </svg>
);
const BoltIcon = () => (
  <svg {...svgProps} width={20} height={20}>
    <path d="M13 3L5 14h6l-1 7 8-11h-6z" />
  </svg>
);
const Chevron = () => (
  <svg {...svgProps} width={16} height={16}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

/* ---------- charts ---------- */

interface DayBucket {
  day: number;
  succeeded: number;
  failed: number;
  durations: number[];
}

function niceMax(v: number): number {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function TrendChart({ buckets }: { buckets: DayBucket[] }) {
  const W = 600;
  const H = 230;
  const pad = { l: 34, r: 12, t: 12, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...buckets.map((b) => Math.max(b.succeeded, b.failed))));
  const x = (i: number) => pad.l + (buckets.length === 1 ? iw / 2 : (i / (buckets.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const line = (key: "succeeded" | "failed") =>
    buckets.map((b, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(b[key]).toFixed(1)}`).join(" ");
  const area = `${line("succeeded")} L${x(buckets.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Execution trend">
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeWidth="1" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)">
            {Math.round(t)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#trend-fill)" />
      <path d={line("succeeded")} fill="none" stroke="var(--color-success)" strokeWidth="2" />
      <path d={line("failed")} fill="none" stroke="var(--color-danger)" strokeWidth="2" />
      {buckets.map((b, i) => (
        <g key={b.day}>
          <circle cx={x(i)} cy={y(b.succeeded)} r="3" fill="var(--color-success)" />
          <circle cx={x(i)} cy={y(b.failed)} r="3" fill="var(--color-danger)" />
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-muted)">
            {shortDay(b.day)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Donut({ succeeded, failed, other }: { succeeded: number; failed: number; other: number }) {
  const total = succeeded + failed + other;
  const r = 52;
  const c = 2 * Math.PI * r;
  const segs = [
    { v: succeeded, color: "var(--color-success)" },
    { v: failed, color: "var(--color-danger)" },
    { v: other, color: "var(--color-neutral)" },
  ];
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label="Execution status">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--color-surface-alt)" strokeWidth="16" />
      {total > 0 &&
        segs.map((s, i) => {
          const len = (s.v / total) * c;
          const el = (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += len;
          return s.v > 0 ? el : null;
        })}
      <text x="70" y="70" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--color-ink)">
        {total}
      </text>
      <text x="70" y="88" textAnchor="middle" fontSize="11" fill="var(--color-muted)">
        Total
      </text>
    </svg>
  );
}

function PerformanceBars({ buckets }: { buckets: DayBucket[] }) {
  const avgs = buckets.map((b) => average(b.durations));
  const max = Math.max(1, ...avgs.map((a) => a ?? 0));
  return (
    <div className="flex h-40 items-end gap-2">
      {buckets.map((b, i) => {
        const a = avgs[i];
        return (
          <div key={b.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div
              className="w-full rounded-t bg-accent"
              style={{ height: `${a === null ? 0 : Math.max(4, (a / max) * 100)}%` }}
              title={formatDuration(a)}
            />
            <span className="text-[0.68rem] text-muted">{shortDay(b.day)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- page ---------- */

export default async function SummaryPage() {
  let error: string | null = null;
  let workflows: Workflow[] = [];
  let executions: Execution[] = [];
  let executionTotal = 0;

  try {
    const [workflowPage, ...execPages] = await Promise.all([
      listWorkflows({ limit: PAGE_SIZE }),
      ...Array.from({ length: PAGES }, (_, i) =>
        listExecutions({ limit: PAGE_SIZE, offset: i * PAGE_SIZE }),
      ),
    ]);
    workflows = workflowPage.items;
    executions = execPages.flatMap((p) => p.items);
    executionTotal = execPages[0].total;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load summary data.";
  }

  const workflowsById = new Map(workflows.map((w) => [w.id, w]));
  const now = new Date();
  const today = startOfDay(now);
  const windowStart = today - (DAYS - 1) * DAY_MS;
  const prevStart = windowStart - DAYS * DAY_MS;

  const buckets: DayBucket[] = Array.from({ length: DAYS }, (_, i) => ({
    day: windowStart + i * DAY_MS,
    succeeded: 0,
    failed: 0,
    durations: [],
  }));

  let cur = { total: 0, succeeded: 0, failed: 0, durations: [] as number[] };
  let prev = { total: 0, succeeded: 0, failed: 0, durations: [] as number[] };
  const allStatus = { succeeded: 0, failed: 0, other: 0 };

  for (const e of executions) {
    const created = new Date(e.created_at).getTime();
    const d = durationMs(e);
    if (e.status === "succeeded") allStatus.succeeded++;
    else if (e.status === "failed") allStatus.failed++;
    else allStatus.other++;

    const target = created >= windowStart ? cur : created >= prevStart ? prev : null;
    if (target) {
      target.total++;
      if (e.status === "succeeded") target.succeeded++;
      if (e.status === "failed") target.failed++;
      if (d !== null) target.durations.push(d);
    }
    if (created >= windowStart) {
      const b = buckets[Math.min(DAYS - 1, Math.floor((created - windowStart) / DAY_MS))];
      if (e.status === "succeeded") b.succeeded++;
      if (e.status === "failed") b.failed++;
      if (d !== null) b.durations.push(d);
    }
  }

  const statusTotal = allStatus.succeeded + allStatus.failed + allStatus.other;
  const pct = (n: number) => (statusTotal ? ((n / statusTotal) * 100).toFixed(1) : "0.0");
  const successRate = statusTotal ? (allStatus.succeeded / statusTotal) * 100 : 0;
  const failureRate = statusTotal ? (allStatus.failed / statusTotal) * 100 : 0;

  const avgCur = average(cur.durations);
  const avgPrev = average(prev.durations);
  const activeWorkflows = workflows.filter((w) => w.is_active).length;

  const recent = executions.slice(0, RECENT_LIMIT);
  const latest = executions[0];
  const healthWorkflow = latest ? workflowsById.get(latest.workflow_id) : workflows[0];
  const healthRuns = healthWorkflow
    ? executions.filter((e) => e.workflow_id === healthWorkflow.id)
    : [];
  const healthRate = healthRuns.length
    ? (healthRuns.filter((e) => e.status === "succeeded").length / healthRuns.length) * 100
    : 0;

  const rangeLabel = `${shortDay(windowStart)} – ${shortDay(today)}, ${now.getFullYear()}`;

  return (
    <div className="pb-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0">Summary</h1>
          <p className="text-[0.85rem] text-muted">
            Key metrics and an overview of your AI workflows and system health.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2 text-[0.8rem] text-ink">
          <ClockIcon size={16} /> {rangeLabel}
        </span>
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/8 px-4 py-3 text-[0.85rem] text-danger">
          {error}
        </div>
      )}

      {!error && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              tone="info"
              icon={<NetworkIcon />}
              label="Total Workflows"
              value={workflows.length}
              sub={`${activeWorkflows} active`}
              delta={<span className="text-[0.78rem] text-muted">{activeWorkflows} of {workflows.length} active</span>}
            />
            <KpiCard
              tone="success"
              icon={<PlayIcon />}
              label="Total Executions"
              value={executionTotal}
              sub={`${cur.total} in last ${DAYS} days`}
              delta={<Delta value={pctChange(cur.total, prev.total)} goodWhenUp />}
            />
            <KpiCard
              tone="success"
              icon={<CheckIcon />}
              label="Successful Executions"
              value={allStatus.succeeded}
              sub={`${successRate.toFixed(1)}% success rate`}
              delta={<Delta value={pctChange(cur.succeeded, prev.succeeded)} goodWhenUp />}
            />
            <KpiCard
              tone="danger"
              icon={<CrossIcon />}
              label="Failed Executions"
              value={allStatus.failed}
              sub={`${failureRate.toFixed(1)}% failure rate`}
              delta={<Delta value={pctChange(cur.failed, prev.failed)} goodWhenUp={false} />}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.7fr_1.2fr_1fr]">
            <Panel
              title="Execution Trend"
              subtitle={`Total executions (successful vs. failed) over the last ${DAYS} days`}
              icon={<TrendIcon />}
              actions={
                <div className="flex items-center gap-4 text-[0.78rem]">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Successful</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Failed</span>
                </div>
              }
            >
              <TrendChart buckets={buckets} />
            </Panel>

            <Panel title="Execution Status" icon={<PulseIcon />}>
              <div className="flex items-center gap-5">
                <Donut {...allStatus} />
                <ul className="m-0 flex-1 list-none space-y-3 p-0 text-[0.85rem]">
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-success" />
                    <span className="flex-1">Successful</span>
                    <b>{allStatus.succeeded}</b>
                    <span className="w-12 text-right text-[0.75rem] text-muted">{pct(allStatus.succeeded)}%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-danger" />
                    <span className="flex-1">Failed</span>
                    <b>{allStatus.failed}</b>
                    <span className="w-12 text-right text-[0.75rem] text-muted">{pct(allStatus.failed)}%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral" />
                    <span className="flex-1">In progress / other</span>
                    <b>{allStatus.other}</b>
                    <span className="w-12 text-right text-[0.75rem] text-muted">{pct(allStatus.other)}%</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="flex items-center gap-2 text-[0.85rem] text-muted">
                  <ClockIcon size={16} /> Average Duration
                </span>
                <span className="flex items-center gap-3">
                  <b className="text-[1.05rem]">{formatDuration(avgCur)}</b>
                  <Delta
                    value={avgCur !== null && avgPrev !== null ? pctChange(avgCur, avgPrev) : null}
                    goodWhenUp={false}
                  />
                </span>
              </div>
            </Panel>

            <Panel title="Workflow Health" subtitle="Most recently active workflow" icon={<PulseIcon />}>
              {healthWorkflow ? (
                <div>
                  <Link
                    href={`/workflows/${healthWorkflow.id}`}
                    className="flex items-center gap-3 rounded-md bg-surface-alt px-3 py-3 text-ink no-underline hover:no-underline"
                  >
                    <WorkflowAvatar workflowId={healthWorkflow.id} name={healthWorkflow.name} />
                    <span className="flex-1 truncate text-[0.9rem] font-medium">{healthWorkflow.name}</span>
                    {latest && <ExecutionStatusBadge status={latest.status} />}
                    <Chevron />
                  </Link>
                  <dl className="mb-0 mt-4 space-y-3 text-[0.85rem]">
                    <div className="flex justify-between">
                      <dt className="text-muted">Last run</dt>
                      <dd className="m-0">{formatDateTime(latest?.created_at ?? null)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Runs (sampled)</dt>
                      <dd className="m-0">{healthRuns.length}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-alt">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${healthRate}%` }} />
                    </div>
                    <span className="text-[0.8rem]">{Math.round(healthRate)}%</span>
                  </div>
                  <p className="mb-0 mt-1 text-[0.72rem] text-muted">Success rate</p>
                </div>
              ) : (
                <p className="m-0 text-[0.85rem] text-muted">No workflows yet.</p>
              )}
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.7fr_1.2fr_1fr]">
            <Panel
              title="Recent Activity"
              subtitle="Latest workflow executions across all workflows"
              icon={<ClockIcon />}
              actions={
                <Link href="/executions" className="text-[0.8rem]">
                  View all →
                </Link>
              }
            >
              {recent.length === 0 ? (
                <p className="m-0 text-[0.85rem] text-muted">No executions yet.</p>
              ) : (
                <table className="w-full border-collapse text-[0.85rem]">
                  <thead>
                    <tr className="text-left text-[0.78rem] text-muted">
                      <th className="pb-2 font-medium">Workflow</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Duration</th>
                      <th className="pb-2 font-medium">Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((e) => {
                      const wf = workflowsById.get(e.workflow_id);
                      return (
                        <tr key={e.id} className="border-t border-border">
                          <td className="py-2.5">
                            <Link
                              href={`/executions/${e.id}`}
                              className="flex items-center gap-2.5 text-ink no-underline hover:no-underline"
                            >
                              <WorkflowAvatar workflowId={e.workflow_id} name={wf?.name ?? "Workflow"} />
                              {wf?.name ?? e.workflow_id.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="py-2.5"><ExecutionStatusBadge status={e.status} /></td>
                          <td className="py-2.5">{formatDuration(durationMs(e))}</td>
                          <td className="py-2.5 text-muted">{formatDateTime(e.started_at ?? e.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Panel>

            <Panel title="Performance Overview" subtitle="Execution time (average)" icon={<BarsIcon />}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[1.6rem] font-bold">{formatDuration(avgCur)}</span>
                <Delta
                  value={avgCur !== null && avgPrev !== null ? pctChange(avgCur, avgPrev) : null}
                  goodWhenUp={false}
                />
              </div>
              <PerformanceBars buckets={buckets} />
            </Panel>

            <Panel title="Quick Actions" icon={<BoltIcon />}>
              <div className="flex flex-col gap-3">
                <Link
                  href="/workflows/new"
                  className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 text-[0.9rem] font-semibold text-white no-underline hover:opacity-90 hover:no-underline"
                >
                  <span className="text-lg leading-none">+</span> New Workflow
                </Link>
                {[
                  { href: "/workflows", label: "View All Workflows", icon: <NetworkIcon size={18} /> },
                  { href: "/executions", label: "View Executions", icon: <PlayIcon size={18} /> },
                  { href: "/queue", label: "Open Queue", icon: <BarsIcon /> },
                ].map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="flex items-center gap-3 rounded-md border border-border bg-surface-alt px-4 py-3 text-[0.88rem] text-ink no-underline hover:border-accent hover:no-underline"
                  >
                    <span className="text-accent">{a.icon}</span>
                    <span className="flex-1">{a.label}</span>
                    <Chevron />
                  </Link>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
