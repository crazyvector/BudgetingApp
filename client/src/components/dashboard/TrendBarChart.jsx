import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Card from "../ui/Card.jsx";
import { formatCompactCurrency } from "../../utils/formatters.js";
import { BarChart3 } from "lucide-react";
import EmptyState from "../ui/EmptyState.jsx";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-card-static px-4 py-3 text-sm">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-secondary capitalize">{entry.name}:</span>
          <span className="text-text-primary font-medium">
            {formatCompactCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TrendBarChart({ data = [] }) {
  return (
    <Card className="animate-slide-up delay-4" style={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Monthly Trend
        </h3>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Transactions will populate this chart"
        />
      ) : (
        <div className="h-[260px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4} barCategoryGap="20%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148, 163, 184, 0.08)"
                vertical={false}
              />
              <XAxis
                dataKey="monthLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
                tickFormatter={formatCompactCurrency}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.05)" }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: "#94A3B8", paddingTop: 8 }}
              />
              <Bar
                dataKey="income"
                name="Income"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                animationBegin={300}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#EF4444"
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                animationBegin={500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
