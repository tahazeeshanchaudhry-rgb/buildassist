type StatusBadgeProps = { status: string; label?: string };

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const tone = normalized === "error" ? "failed" : normalized;
  const display = label ?? status.replaceAll("_", " ");
  return <span className={`ba-status ba-status-${tone} capitalize`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />{display}</span>;
}
