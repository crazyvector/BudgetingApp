export default function ProgressBar({ value, max, color, className = "" }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100)) || 0;

  return (
    <div className={`w-full h-2.5 bg-surface-700 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${percentage}%`,
          backgroundColor: color || "var(--color-brand-500)",
        }}
      />
    </div>
  );
}
