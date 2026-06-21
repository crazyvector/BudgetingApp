import { useState, useEffect } from "react";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Button from "../ui/Button.jsx";
import { formatDateForInput } from "../../utils/formatters.js";

const priorityOptions = [
  { value: "LOW", label: "Low Priority" },
  { value: "MEDIUM", label: "Medium Priority" },
  { value: "HIGH", label: "High Priority" },
];

const recurrenceOptions = [
  { value: "", label: "Does not repeat" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

export default function TaskForm({ initialData = null, onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    recurrenceRule: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title,
        description: initialData.description || "",
        dueDate: initialData.dueDate ? formatDateForInput(initialData.dueDate) : "",
        priority: initialData.priority,
        recurrenceRule: initialData.recurrenceRule || "",
      });
    }
  }, [initialData]);

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
    if (!form.title.trim()) errs.title = "Title is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate || null,
      priority: form.priority,
      recurring: !!form.recurrenceRule,
      recurrenceRule: form.recurrenceRule || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Task Title"
        placeholder="e.g. Pay credit card bill"
        value={form.title}
        onChange={handleChange("title")}
        error={errors.title}
      />

      <Input
        label="Description (Optional)"
        placeholder="Any additional details..."
        value={form.description}
        onChange={handleChange("description")}
      />

      <Input
        label="Due Date (Optional)"
        type="date"
        value={form.dueDate}
        onChange={handleChange("dueDate")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Priority"
          options={priorityOptions}
          value={form.priority}
          onChange={handleChange("priority")}
        />
        <Select
          label="Recurrence"
          options={recurrenceOptions}
          value={form.recurrenceRule}
          onChange={handleChange("recurrenceRule")}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? "Update" : "Add"} Task
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
