"use client";
import { useEffect, useRef, useState } from "react";

type filterkey = "all" | "active" | "inactive" | "Elham";

const FILTERS: { key: filterkey; label: string }[] = [
  { key: "Elham", label: "Elham" },
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

export default function Sidenav() {
  const [selected, setSelected] = useState<filterkey>("all");
  return (
    <>
      <div className="flex h-full w-full flex-col gap-1 rounded-lg border border-slate-700/20 bg-slate-900/60 p-3  transition-transform duration-200">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setSelected(f.key)}
            className={`w-full rounded-md border-l-[3px] px-3 py-2.5 text-left text-sm transition-colors hover:scale-105 ${
              selected === f.key
                ? "border-blue-500 bg-blue-500/15 text-blue-400"
                : "border-transparent text-slate-300/80 hover:bg-slate-400/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </>
  );
}
