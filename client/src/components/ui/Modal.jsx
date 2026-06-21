import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children, size = "md" }) {
  const dialogRef = useRef(null);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Close on backdrop click
  function handleBackdropClick(e) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={handleBackdropClick}
      className={`
        ${sizeClasses[size]} w-[calc(100%-2rem)] p-0 m-auto
        bg-surface-800 border border-glass-border
        rounded-2xl shadow-elevated
        backdrop:bg-black/60 backdrop:backdrop-blur-sm
        animate-scale-in
        text-text-primary
      `}
    >
      <div className="flex items-center justify-between p-5 border-b border-glass-border">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-glass-hover transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
