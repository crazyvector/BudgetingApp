import { useState, useEffect } from "react";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Button from "../ui/Button.jsx";
import { formatDateForInput } from "../../utils/formatters.js";

export default function TransactionForm({
  categories = [],
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
      });
    }
  }, [initialData]);

  // Filter categories based on selected type
  const filteredCategories = categories.filter(
    (c) => c.type === form.type || c.type === "BOTH"
  );

  const categoryOptions = filteredCategories.map((c) => ({
    value: c.id,
    label: `${c.icon} ${c.name}`,
  }));

  function handleChange(field) {
    return (e) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear error on change
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }));
      }
      // Reset category when type changes
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
