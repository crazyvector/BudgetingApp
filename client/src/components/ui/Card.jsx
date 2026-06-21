export default function Card({ children, className = "", hover = true, ...props }) {
  return (
    <div
      className={`${hover ? "glass-card" : "glass-card-static"} p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
