import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "../../utils/formatters.js";

export default function SummaryCards({ data }) {
  const { totalIncome = 0, totalExpenses = 0, balance = 0 } = data || {};

  const cards = [
    {
      label: "Balance",
      value: balance,
      icon: Wallet,
      gradient: "gradient-balance",
      trend: balance >= 0 ? "positive" : "negative",
    },
    {
      label: "Income",
      value: totalIncome,
      icon: TrendingUp,
      gradient: "gradient-income",
      trend: "positive",
    },
    {
      label: "Expenses",
      value: totalExpenses,
      icon: TrendingDown,
      gradient: "gradient-expense",
      trend: "negative",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const TrendIcon = card.trend === "positive" ? ArrowUpRight : ArrowDownRight;

        return (
          <div
            key={card.label}
            className={`glass-card p-5 animate-slide-up delay-${i + 1}`}
            style={{ opacity: 0 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl ${card.gradient} flex items-center justify-center shadow-lg`}
              >
                <Icon size={18} className="text-white" />
              </div>
              <TrendIcon
                size={16}
                className={
                  card.trend === "positive"
                    ? "text-success"
                    : "text-danger"
                }
              />
            </div>

            <p className="text-sm text-text-muted font-medium mb-1">
              {card.label}
            </p>
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              {formatCurrency(card.value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
