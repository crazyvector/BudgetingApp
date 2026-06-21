import { Calendar, AlertCircle, Clock, CheckCircle2, Circle } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import { formatDate } from "../../utils/formatters.js";
import { isPast, isToday, parseISO } from "date-fns";

export default function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const { title, description, dueDate, priority, completed, recurring, recurrenceRule } = task;

  const getPriorityColor = () => {
    switch (priority) {
      case "HIGH": return "#EF4444"; // red
      case "MEDIUM": return "#F59E0B"; // amber
      case "LOW": return "#10B981"; // emerald
      default: return "#64748B";
    }
  };

  const getDueDateDisplay = () => {
    if (!dueDate) return null;
    const date = parseISO(dueDate);
    let color = "text-text-muted";
    let Icon = Calendar;

    if (!completed) {
      if (isPast(date) && !isToday(date)) {
        color = "text-danger";
        Icon = AlertCircle;
      } else if (isToday(date)) {
        color = "text-warning";
        Icon = Clock;
      }
    }

    return (
      <div className={`flex items-center gap-1.5 text-xs font-medium ${color}`}>
        <Icon size={14} />
        {formatDate(dueDate)}
      </div>
    );
  };

  return (
    <div className={`
      flex items-start gap-3 p-4 rounded-xl border border-glass-border transition-all duration-200
      ${completed ? "bg-surface-800/50 opacity-60" : "bg-surface-800 hover:border-glass-hover shadow-sm"}
    `}>
      <button
        onClick={() => onToggle(task)}
        className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${completed ? "text-success" : "text-text-muted hover:text-brand-400"}`}
      >
        {completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5 cursor-pointer" onClick={() => onEdit(task)}>
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-medium truncate ${completed ? "line-through text-text-muted" : "text-text-primary"}`}>
            {title}
          </h4>
          <div className="flex items-center gap-2 shrink-0">
            {recurring && (
              <Badge color="#6366F1" className="text-[10px]">
                {recurrenceRule}
              </Badge>
            )}
            <Badge color={getPriorityColor()} className="text-[10px]">
              {priority}
            </Badge>
          </div>
        </div>

        {description && (
          <p className="text-xs text-text-muted line-clamp-2">
            {description}
          </p>
        )}

        {dueDate && getDueDateDisplay()}
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="p-1.5 opacity-0 group-hover:opacity-100 lg:opacity-100 rounded-lg hover:bg-danger/15 text-text-muted hover:text-danger transition-colors cursor-pointer shrink-0"
      >
        <span className="sr-only">Delete</span>
        &times;
      </button>
    </div>
  );
}
