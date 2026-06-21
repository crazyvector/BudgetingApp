import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { ArrowUpRight, ArrowDownRight, Pencil, Trash2 } from "lucide-react";

export default function TransactionList({
  transactions = [],
  onEdit,
  onDelete,
  pagination,
  onPageChange,
}) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p className="text-lg mb-1">No transactions found</p>
        <p className="text-sm">Try adjusting your filters or add a new transaction</p>
      </div>
    );
  }

  return (
    <div>
      {/* Transaction rows */}
      <div className="flex flex-col gap-2">
        {transactions.map((tx, i) => (
          <div
            key={tx.id}
            className="glass-card-static p-4 flex items-center gap-3 group hover:border-glass-hover transition-all duration-200"
            style={{ animation: `fade-in 0.3s ease-out ${i * 30}ms both` }}
          >
            {/* Category icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
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
            <div className="flex items-center gap-1 shrink-0">
              {tx.type === "INCOME" ? (
                <ArrowUpRight size={14} className="text-success" />
              ) : (
                <ArrowDownRight size={14} className="text-danger" />
              )}
              <span
                className={`text-sm font-bold tabular-nums ${
                  tx.type === "INCOME" ? "text-success" : "text-danger"
                }`}
              >
                {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
              <button
                onClick={() => onEdit(tx)}
                className="p-1.5 rounded-lg hover:bg-brand-500/15 text-text-muted hover:text-brand-400 transition-colors cursor-pointer"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(tx.id)}
                className="p-1.5 rounded-lg hover:bg-danger/15 text-text-muted hover:text-danger transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-glass-border">
          <p className="text-sm text-text-muted">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm bg-surface-700 text-text-secondary hover:bg-surface-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Prev
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg text-sm bg-surface-700 text-text-secondary hover:bg-surface-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
