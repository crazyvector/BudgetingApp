import { useState, useEffect } from "react";
import api from "../api/client.js";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import { Plus, Clock, Trash2, Edit2, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency, formatDate } from "../utils/formatters.js";

export default function RecurringPage() {
  const [recurrings, setRecurrings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    amount: "",
    type: "EXPENSE",
    description: "",
    categoryId: "",
    frequency: "MONTHLY",
    startDate: new Date().toISOString().split("T")[0],
    active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [recRes, catRes] = await Promise.all([
        api.get("/recurring"),
        api.get("/categories")
      ]);
      setRecurrings(recRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openNewModal() {
    setEditing(null);
    setForm({
      amount: "",
      type: "EXPENSE",
      description: "",
      categoryId: "",
      frequency: "MONTHLY",
      startDate: new Date().toISOString().split("T")[0],
      active: true
    });
    setModalOpen(true);
  }

  function openEditModal(rec) {
    setEditing(rec.id);
    setForm({
      amount: rec.amount,
      type: rec.type,
      description: rec.description,
      categoryId: rec.categoryId,
      frequency: rec.frequency,
      startDate: new Date(rec.startDate).toISOString().split("T")[0],
      active: rec.active
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount)
      };
      
      if (editing) {
        await api.put(`/recurring/${editing}`, payload);
      } else {
        await api.post("/recurring", payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    if (confirm("Delete this recurring transaction?")) {
      await api.delete(`/recurring/${id}`);
      fetchData();
    }
  }

  async function toggleActive(id, current) {
    await api.put(`/recurring/${id}`, { active: !current });
    fetchData();
  }

  const filteredCategories = categories.filter(c => c.type === form.type || c.type === "BOTH");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Subscriptions & Recurring</h2>
          <p className="text-sm text-text-muted">Manage your automatic monthly bills.</p>
        </div>
        <Button onClick={openNewModal}>
          <Plus size={16} className="mr-2" /> Add Recurring
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurrings.map(rec => (
            <div key={rec.id} className={`p-4 rounded-xl border ${rec.active ? 'border-border-light bg-surface-800/50' : 'border-border-dark bg-surface-900/50 opacity-60'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm" style={{ backgroundColor: `${rec.category.color}20` }}>
                    {rec.category.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{rec.description}</h3>
                    <p className="text-xs text-text-muted">{rec.category.name}</p>
                  </div>
                </div>
                <span className={`font-bold ${rec.type === 'INCOME' ? 'text-success' : 'text-text-primary'}`}>
                  {rec.type === 'INCOME' ? '+' : '-'}{formatCurrency(rec.amount)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                <Clock size={14} className="text-brand-400" />
                <span>Repeats {rec.frequency.toLowerCase()}</span>
              </div>
              <div className="text-xs text-text-muted mb-4">
                Next billing: <span className="font-medium text-text-primary">{formatDate(rec.nextDate)}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border-light">
                <button 
                  onClick={() => toggleActive(rec.id, rec.active)}
                  className={`flex items-center gap-1 text-xs font-medium ${rec.active ? 'text-danger hover:text-danger-hover' : 'text-success hover:text-success-hover'}`}
                >
                  {rec.active ? <><XCircle size={14}/> Disable</> : <><CheckCircle2 size={14}/> Enable</>}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(rec)} className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(rec.id)} className="p-1.5 text-text-muted hover:text-danger transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {recurrings.length === 0 && (
            <div className="col-span-full text-center py-12 text-text-muted bg-surface-800/30 rounded-xl border border-border-light border-dashed">
              No recurring transactions yet. Add one to automate your bills!
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Recurring" : "New Recurring"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2 p-1 bg-surface-700 rounded-xl">
            {["EXPENSE", "INCOME"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: t, categoryId: "" }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  form.type === t ? (t === "INCOME" ? "bg-success/20 text-success" : "bg-danger/20 text-danger") : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {t === "INCOME" ? "Income" : "Expense"}
              </button>
            ))}
          </div>

          <Input label="Amount" type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
          <Input label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
          
          <Select 
            label="Category" 
            value={form.categoryId} 
            onChange={e => setForm({...form, categoryId: e.target.value})} 
            options={filteredCategories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))} 
            required 
          />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Frequency" 
              value={form.frequency} 
              onChange={e => setForm({...form, frequency: e.target.value})} 
              options={[
                { value: "MONTHLY", label: "Monthly" },
                { value: "WEEKLY", label: "Weekly" },
                { value: "DAILY", label: "Daily" },
                { value: "YEARLY", label: "Yearly" }
              ]}
              required 
            />
            <Input label="Start Date" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required />
          </div>

          <Button type="submit" className="mt-2">{editing ? "Update" : "Save"} Recurring</Button>
        </form>
      </Modal>
    </div>
  );
}
