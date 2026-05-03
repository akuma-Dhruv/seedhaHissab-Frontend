interface DateGroupHeaderProps {
  /** Display label e.g. "Today", "Overdue", "12 Apr 2026". */
  label: string;
  /** Optional secondary text e.g. count. */
  hint?: string;
}

/**
 * Slim section header used by timeline lists that group entries by day or
 * by bucket. Stays low-emphasis so the timeline rows remain the focal point.
 */
export function DateGroupHeader({ label, hint }: DateGroupHeaderProps) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
