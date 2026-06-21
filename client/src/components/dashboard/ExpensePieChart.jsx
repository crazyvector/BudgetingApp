import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Card from "../ui/Card.jsx";
import { formatCurrency } from "../../utils/formatters.js";
import { Layers } from "lucide-react";
import EmptyState from "../ui/EmptyState.jsx";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { categoryName, total, color, icon } = payload[0].payload;

  return (
    <div className="glass-card-static px-3 py-2 text-sm">
      <p className="font-medium text-text-primary">
        {icon} {categoryName}
      </p>
      <p className="text-text-secondary">{formatCurrency(total)}</p>
    </div>
  );
}

export default function ExpensePieChart({ data = [] }) {
  const totalExpenses = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card className="animate-slide-up delay-3" style={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Expenses by Category
        </h3>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No expenses yet"
          description="Add some expenses to see the breakdown"
        />
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Pie Chart */}
          <div className="w-full lg:w-1/2 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="total"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={800}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="w-full lg:w-1/2 flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
            {data.map((entry) => {
              const pct = totalExpenses
                ? ((entry.total / totalExpenses) * 100).toFixed(1)
                : 0;
              return (
                <div
                  key={entry.categoryId}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-glass-hover transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-text-primary flex-1 truncate">
                    {entry.icon} {entry.categoryName}
                  </span>
                  <span className="text-sm text-text-muted font-medium tabular-nums">
                    {pct}%
                  </span>
                  <span className="text-sm text-text-secondary font-semibold tabular-nums">
                    {formatCurrency(entry.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
