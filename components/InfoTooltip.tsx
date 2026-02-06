"use client";

type InfoTooltipProps = {
  label: string;
  description: string;
};

export function InfoTooltip({ label, description }: InfoTooltipProps) {
  return (
    <span className="group relative inline-flex items-center gap-2">
      <span>{label}</span>
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/30 text-[10px] text-white/70">
        i
      </span>
      <span className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-64 rounded-xl border border-white/10 bg-space-800/95 p-3 text-xs text-white/80 opacity-0 shadow-glow transition group-hover:opacity-100">
        {description}
      </span>
    </span>
  );
}
