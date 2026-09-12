interface StatTileProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-[0.9rem]">
      <div className="text-[1.6rem] font-bold">{value}</div>
      <div className="text-[0.8rem] tracking-wide text-muted uppercase">{label}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
