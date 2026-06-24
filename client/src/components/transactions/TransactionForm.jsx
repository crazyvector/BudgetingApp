import { useState, useEffect } from "react";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Button from "../ui/Button.jsx";
import { formatDateForInput } from "../../utils/formatters.js";

export default function TransactionForm({
  categories = [],
  accounts = [],
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [form, setForm] = useState({
    amount: "",
    type: "EXPENSE",
    description: "",
    date: formatDateForInput(new Date()),
    categoryId: "",
    accountId: "",
  });
  const [updateAllRelated, setUpdateAllRelated] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        amount: String(initialData.amount),
        type: initialData.type,
        description: initialData.description || "",
        date: formatDateForInput(initialData.date),
        categoryId: initialData.categoryId,
        accountId: initialData.accountId || "",
      });
    }
  }, [initialData]);

  // Show all categories, maybe sorted or grouped, but without filtering out by type.
  // We'll just map all of them so the user can easily switch from expense to income directly from the dropdown.
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: `${c.icon} ${c.name} ${c.type === "INCOME" ? "(Income)" : c.type === "EXPENSE" ? "(Expense)" : ""}`,
  }));

  const accountOptions = [
    { value: "", label: "No Account / Cash" },
    ...accounts.map((a) => ({
      value: a.id,
      label: `${a.icon} ${a.name}`,
    }))
  ];

  function handleChange(field) {
    return (e) => {
      const value = e.target.value;
      
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        // If they select a category, automatically update the type to match it
        if (field === "categoryId") {
          const selected = categories.find(c => c.id === value);
          if (selected && selected.type !== "BOTH") {
            next.type = selected.type;
          }
        }
        return next;
      });

      // Clear error on change
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }));
      }
      
      // If they manually toggle the type button, reset the category
      if (field === "type") {
        setForm((prev) => ({ ...prev, categoryId: "", [field]: value }));
      }
    };
  }

  function validate() {
    const errs = {};
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      errs.amount = "Enter a valid positive amount";
    }
    if (!form.date) errs.date = "Date is required";
    if (!form.categoryId) errs.categoryId = "Select a category";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      amount: parseFloat(form.amount),
      type: form.type,
      description: form.description,
      date: form.date,
      categoryId: form.categoryId,
      accountId: form.accountId || undefined,
      updateAllRelated,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Type toggle */}
      <div className="flex gap-2 p-1 bg-surface-700 rounded-xl">
        {["EXPENSE", "INCOME"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleChange("type")({ target: { value: t } })}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
              ${
                form.type === t
                  ? t === "INCOME"
                    ? "bg-success/20 text-success shadow-sm"
                    : "bg-danger/20 text-danger shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
          >
            {t === "INCOME" ? "💰 Income" : "💸 Expense"}
          </button>
        ))}
      </div>

      {/* Amount */}
      <Input
        label="Amount (RON)"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={form.amount}
        onChange={handleChange("amount")}
        error={errors.amount}
      />

      {/* Category */}
      <Select
        label="Category"
        options={categoryOptions}
        placeholder="Select a category..."
        value={form.categoryId}
        onChange={handleChange("categoryId")}
        error={errors.categoryId}
      />

      {/* Account */}
      <Select
        label="Account"
        options={accountOptions}
        value={form.accountId}
        onChange={handleChange("accountId")}
      />

      {/* Date */}
      <Input
        label="Date"
        type="date"
        value={form.date}
        onChange={handleChange("date")}
        error={errors.date}
      />

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Input
          label="Description (optional)"
          placeholder="e.g. Weekly groceries"
          value={form.description}
          onChange={handleChange("description")}
        />
        {initialData && initialData.description && (
          <div className="flex items-center gap-2 mt-1 px-1">
            <input 
              type="checkbox" 
              id="updateAllRelated" 
              checked={updateAllRelated} 
              onChange={(e) => setUpdateAllRelated(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 border-border-light focus:ring-brand-500"
            />
            <label htmlFor="updateAllRelated" className="text-sm text-text-secondary cursor-pointer">
              Also update all past transactions from "{initialData.description}"
            </label>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? "Update" : "Add"} Transaction
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
