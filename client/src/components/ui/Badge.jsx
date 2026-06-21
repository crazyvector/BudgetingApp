export default function Badge({ children, color, className = "" }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-0.5
        text-xs font-medium rounded-full
        ${className}
      `}
      style={{
        backgroundColor: color ? `${color}20` : undefined,
        color: color || undefined,
        border: color ? `1px solid ${color}30` : undefined,
      }}
    >
      {children}
    </span>
  );
}
