import { useState } from "react";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { formatCurrency, formatDateForInput } from "../../utils/formatters.js";

export default function ContributionForm({ goal, onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState({
    amount: "",
    date: formatDateForInput(new Date()),
    note: "",
  });
  const [errors, setErrors] = useState({});

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

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
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      errs.amount = "Enter a valid positive amount";
    }
    if (!form.date) errs.date = "Date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      amount: parseFloat(form.amount),
      date: form.date,
      note: form.note,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="p-3 bg-surface-700/50 rounded-xl mb-2 text-center">
        <p className="text-sm text-text-secondary">Remaining to reach goal</p>
        <p className="text-xl font-bold text-text-primary" style={{ color: goal.color }}>
          {formatCurrency(remaining)}
        </p>
      </div>

      <Input
        label="Contribution Amount ($)"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={form.amount}
        onChange={handleChange("amount")}
        error={errors.amount}
      />

      <Input
        label="Date"
        type="date"
        value={form.date}
        onChange={handleChange("date")}
        error={errors.date}
      />

      <Input
        label="Note (Optional)"
        placeholder="e.g. Monthly transfer"
        value={form.note}
        onChange={handleChange("note")}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          Add Funds
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
