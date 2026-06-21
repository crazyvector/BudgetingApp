import Card from "../ui/Card.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import { formatCurrency, getPercentage, getBudgetStatus } from "../../utils/formatters.js";
import { Pencil, Trash2 } from "lucide-react";
import Badge from "../ui/Badge.jsx";

export default function BudgetCard({ budget, onEdit, onDelete }) {
  const { limit, spent, category } = budget;
  const status = getBudgetStatus(spent, limit);
  const percentage = getPercentage(spent, limit).toFixed(0);
  const remaining = Math.max(0, limit - spent);

  return (
    <Card className="flex flex-col gap-4 group">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: `${category?.color}20` }}
          >
            {category?.icon}
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{category?.name}</h3>
            <p className="text-sm text-text-muted">
              {formatCurrency(spent)} of {formatCurrency(limit)}
            </p>
          </div>
        </div>

        {/* Actions - visible on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 rounded-lg hover:bg-brand-500/15 text-text-muted hover:text-brand-400 transition-colors cursor-pointer"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="p-1.5 rounded-lg hover:bg-danger/15 text-text-muted hover:text-danger transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted font-medium">{percentage}% Spent</span>
          <span className="text-text-primary font-medium">{formatCurrency(remaining)} Left</span>
        </div>
        <ProgressBar value={spent} max={limit} color={status.color} />
      </div>

      <div className="flex justify-between items-center mt-1">
        <Badge color={status.color}>{status.label}</Badge>
      </div>
    </Card>
  );
}
