// Category colors for charts (fallback palette)
export const CHART_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B",
  "#10B981", "#3B82F6", "#EF4444", "#14B8A6",
  "#F97316", "#A855F7", "#06B6D4", "#F472B6",
];

// Transaction type options
export const TRANSACTION_TYPES = [
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
];

// Priority options for tasks
export const PRIORITIES = [
  { value: "LOW", label: "Low", color: "#3B82F6" },
  { value: "MEDIUM", label: "Medium", color: "#F59E0B" },
  { value: "HIGH", label: "High", color: "#EF4444" },
];

// Recurrence options
export const RECURRENCE_OPTIONS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

// Navigation items
export const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { path: "/transactions", label: "Transactions", icon: "ArrowLeftRight" },
  { path: "/budgets", label: "Budgets", icon: "PieChart" },
  { path: "/goals", label: "Goals", icon: "Target" },
  { path: "/tasks", label: "Tasks", icon: "CheckSquare" },
];
