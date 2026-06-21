import { useState, useEffect } from "react";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Button from "../ui/Button.jsx";

export default function BudgetForm({
  categories = [],
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [form, setForm] = useState({
    limit: "",
    categoryId: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        limit: String(initialData.limit),
        categoryId: initialData.categoryId,
      });
    }
  }, [initialData]);

  // Only allow EXPENSE categories for budgets
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE" || c.type === "BOTH");
  const categoryOptions = expenseCategories.map((c) => ({
    value: c.id,
    label: `${c.icon} ${c.name}`,
  }));

  function handleChange(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }));
      }
    };
  }

  function validate() {
    const errs = {};
    const limit = parseFloat(form.limit);
    if (!form.limit || isNaN(limit) || limit <= 0) {
      errs.limit = "Enter a valid positive amount";
    }
    if (!form.categoryId) errs.categoryId = "Select a category";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    onSubmit({
      limit: parseFloat(form.limit),
      categoryId: form.categoryId,
      month: currentMonth,
      year: currentYear,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label="Category"
        options={categoryOptions}
        placeholder="Select category to budget..."
        value={form.categoryId}
        onChange={handleChange("categoryId")}
        error={errors.categoryId}
        disabled={!!initialData} // Cannot change category of existing budget easily, usually just edit amount
      />

      <Input
        label="Monthly Limit (RON)"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={form.limit}
        onChange={handleChange("limit")}
        error={errors.limit}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? "Update" : "Create"} Budget
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
