import { useState, useEffect } from "react";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Button from "../ui/Button.jsx";
import { formatDateForInput } from "../../utils/formatters.js";

const iconOptions = [
  { value: "🎯", label: "🎯 Target" },
  { value: "🚗", label: "🚗 Car" },
  { value: "✈️", label: "✈️ Travel" },
  { value: "🏠", label: "🏠 Home" },
  { value: "💻", label: "💻 Tech" },
  { value: "🎓", label: "🎓 Education" },
  { value: "🛡️", label: "🛡️ Emergency" },
  { value: "🎉", label: "🎉 Event" },
];

const colorOptions = [
  { value: "#6366F1", label: "Indigo" }, // brand
  { value: "#10B981", label: "Emerald" }, // success
  { value: "#F59E0B", label: "Amber" }, // warning
  { value: "#EF4444", label: "Red" }, // danger
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#0EA5E9", label: "Sky" },
];

export default function GoalForm({ initialData = null, onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    color: "#6366F1",
    icon: "🎯",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        targetAmount: String(initialData.targetAmount),
        deadline: initialData.deadline ? formatDateForInput(initialData.deadline) : "",
        color: initialData.color,
        icon: initialData.icon,
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
    if (!form.name.trim()) errs.name = "Name is required";
    
    const target = parseFloat(form.targetAmount);
    if (!form.targetAmount || isNaN(target) || target <= 0) {
      errs.targetAmount = "Enter a valid target amount";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: form.name.trim(),
      targetAmount: parseFloat(form.targetAmount),
      deadline: form.deadline || null,
      color: form.color,
      icon: form.icon,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Goal Name"
        placeholder="e.g. New Car"
        value={form.name}
        onChange={handleChange("name")}
        error={errors.name}
      />

      <Input
        label="Target Amount (RON)"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={form.targetAmount}
        onChange={handleChange("targetAmount")}
        error={errors.targetAmount}
      />

      <Input
        label="Target Deadline (Optional)"
        type="date"
        value={form.deadline}
        onChange={handleChange("deadline")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Icon"
          options={iconOptions}
          value={form.icon}
          onChange={handleChange("icon")}
        />
        <Select
          label="Color Theme"
          options={colorOptions}
          value={form.color}
          onChange={handleChange("color")}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? "Update" : "Create"} Goal
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
