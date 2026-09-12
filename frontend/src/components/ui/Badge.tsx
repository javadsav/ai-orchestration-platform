import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "danger" | "warning" | "info";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-neutral/30 bg-neutral/15 text-neutral",
  success: "border-success/30 bg-success/15 text-success",
  danger: "border-danger/30 bg-danger/15 text-danger",
  warning: "border-warning/30 bg-warning/15 text-warning",
  info: "border-info/30 bg-info/15 text-info",
};

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-[0.72rem] font-semibold tracking-wide uppercase ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
