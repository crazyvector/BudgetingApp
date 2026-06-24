import { useState } from "react";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Button from "../ui/Button.jsx";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function TransactionFilters({
  categories = [],
  accounts = [],
  filters,
  onFilterChange,
}) {
  const [expanded, setExpanded] = useState(false);

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "INCOME", label: "💰 Income" },
    { value: "EXPENSE", label: "💸 Expense" },
  ];

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((c) => ({
      value: c.id,
      label: `${c.icon} ${c.name}`,
    })),
  ];

  const accountOptions = [
    { value: "", label: "All Accounts" },
    ...accounts.map((a) => ({
      value: a.id,
      label: `${a.icon} ${a.name}`,
    })),
  ];

  const sortOptions = [
    { value: "date-desc", label: "Newest First" },
    { value: "date-asc", label: "Oldest First" },
    { value: "amount-desc", label: "Highest Amount" },
    { value: "amount-asc", label: "Lowest Amount" },
  ];

  function handleChange(field) {
    return (e) => onFilterChange({ ...filters, [field]: e.target.value });
  }

  function handleSortChange(e) {
    const [sortBy, sortOrder] = e.target.value.split("-");
    onFilterChange({ ...filters, sortBy, sortOrder });
  }

  function clearFilters() {
    onFilterChange({
      type: "",
      categoryId: "",
      accountId: "",
      startDate: "",
      endDate: "",
      search: "",
      sortBy: "date",
      sortOrder: "desc",
    });
  }

  const hasActiveFilters =
    filters.type ||
    filters.categoryId ||
    filters.accountId ||
    filters.startDate ||
    filters.endDate ||
    filters.search;

  return (
    <div className="glass-card-static p-4 flex flex-col gap-3">
      {/* Search bar + toggle */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search || ""}
            onChange={handleChange("search")}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-700 border border-glass-border text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm"
          />
        </div>
        <Button
          variant={expanded ? "primary" : "secondary"}
          size="md"
          onClick={() => setExpanded(!expanded)}
          className="shrink-0"
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="md" onClick={clearFilters}>
            <X size={16} />
          </Button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-glass-border animate-fade-in">
          <Select
            label="Type"
            options={typeOptions}
            value={filters.type || ""}
            onChange={handleChange("type")}
          />
          <Select
            label="Category"
            options={categoryOptions}
            value={filters.categoryId || ""}
            onChange={handleChange("categoryId")}
          />
          <Select
            label="Account"
            options={accountOptions}
            value={filters.accountId || ""}
            onChange={handleChange("accountId")}
          />
          <Input
            label="From"
            type="date"
            value={filters.startDate || ""}
            onChange={handleChange("startDate")}
          />
          <Input
            label="To"
            type="date"
            value={filters.endDate || ""}
            onChange={handleChange("endDate")}
          />
          <Select
            label="Sort By"
            options={sortOptions}
            value={`${filters.sortBy || "date"}-${filters.sortOrder || "desc"}`}
            onChange={handleSortChange}
          />
        </div>
      )}
    </div>
  );
}
