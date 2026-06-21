import Card from "../ui/Card.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import { formatCurrency, getPercentage, formatDate } from "../../utils/formatters.js";
import { Pencil, Trash2, Plus } from "lucide-react";
import Button from "../ui/Button.jsx";

export default function GoalCard({ goal, onEdit, onDelete, onAddContribution }) {
  const { name, targetAmount, currentAmount, deadline, color, icon, completed } = goal;
  const percentage = getPercentage(currentAmount, targetAmount).toFixed(0);

  return (
    <Card className="flex flex-col gap-4 group relative overflow-hidden">
      {/* Background glow using the goal's color */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl -mr-10 -mt-10 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-lg">{name}</h3>
            <p className="text-sm text-text-muted">
              {formatCurrency(currentAmount)} of {formatCurrency(targetAmount)}
            </p>
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(goal)}
            className="p-1.5 rounded-lg hover:bg-brand-500/15 text-text-muted hover:text-brand-400 transition-colors cursor-pointer"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1.5 rounded-lg hover:bg-danger/15 text-text-muted hover:text-danger transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted font-medium">{percentage}% Reached</span>
          {deadline && (
            <span className="text-text-secondary font-medium">
              Target: {formatDate(deadline)}
            </span>
          )}
        </div>
        <ProgressBar value={currentAmount} max={targetAmount} color={color} />
      </div>

      <div className="mt-2 relative z-10">
        <Button 
          variant={completed || currentAmount >= targetAmount ? "secondary" : "primary"} 
          className="w-full"
          onClick={() => onAddContribution(goal)}
          disabled={completed || currentAmount >= targetAmount}
        >
          <Plus size={16} />
          {completed || currentAmount >= targetAmount ? "Goal Reached" : "Add Funds"}
        </Button>
      </div>
    </Card>
  );
}
