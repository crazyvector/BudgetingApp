import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import EmptyState from "../ui/EmptyState.jsx";

export default function RecentTransactions({ data = [] }) {
  return (
    <Card className="animate-slide-up delay-5" style={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Recent Transactions
        </h3>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No transactions"
          description="Your latest transactions will appear here"
        />
      ) : (
        <div className="flex flex-col divide-y divide-glass-border">
          {data.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 group"
            >
              {/* Category icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: `${tx.category?.color}20` }}
              >
                {tx.category?.icon || "📁"}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {tx.description || tx.category?.name}
                </p>
                <p className="text-xs text-text-muted">
                  {tx.category?.name} · {formatDate(tx.date)}
                </p>
              </div>

              {/* Amount */}
              <div className="flex items-center gap-1.5 shrink-0">
                {tx.type === "INCOME" ? (
                  <ArrowUpRight size={14} className="text-success" />
                ) : (
                  <ArrowDownRight size={14} className="text-danger" />
                )}
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    tx.type === "INCOME" ? "text-success" : "text-danger"
                  }`}
                >
                  {tx.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
