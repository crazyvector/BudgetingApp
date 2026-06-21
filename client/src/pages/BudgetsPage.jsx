import { useState, useEffect, useCallback } from "react";
import BudgetCard from "../components/budgets/BudgetCard.jsx";
import BudgetForm from "../components/budgets/BudgetForm.jsx";
import Modal from "../components/ui/Modal.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { Plus, PieChart } from "lucide-react";
import toast from "react-hot-toast";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../api/budgets.js";
import { getCategories } from "../api/categories.js";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBudgets(currentMonth);
      setBudgets(data);
    } catch (err) {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  async function handleSubmit(data) {
    try {
      setFormLoading(true);
      if (editing) {
        await updateBudget(editing.id, data);
        toast.success("Budget updated");
      } else {
        await createBudget(data);
        toast.success("Budget created");
      }
      setModalOpen(false);
      setEditing(null);
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this budget?")) return;
    try {
      await deleteBudget(id);
      toast.success("Budget deleted");
      fetchBudgets();
    } catch (err) {
      toast.error("Failed to delete budget");
    }
  }

  function openNewModal() {
    setEditing(null);
    setModalOpen(true);
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function handlePrevMonth() {
    setCurrentMonth(prev => {
      let m = prev.month - 1;
      let y = prev.year;
      if (m < 1) { m = 12; y--; }
      return { month: m, year: y };
    });
  }

  function handleNextMonth() {
    setCurrentMonth(prev => {
      let m = prev.month + 1;
      let y = prev.year;
      if (m > 12) { m = 1; y++; }
      return { month: m, year: y };
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Monthly Budgets
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Manage your spending limits by category
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Month Navigator */}
          <div className="flex items-center bg-surface-700 rounded-xl p-1">
             <button onClick={handlePrevMonth} className="px-3 py-1.5 rounded-lg hover:bg-surface-600 text-sm cursor-pointer transition-colors">&lt;</button>
             <span className="min-w-[120px] text-center text-sm font-medium">
               {monthNames[currentMonth.month - 1]} {currentMonth.year}
             </span>
             <button onClick={handleNextMonth} className="px-3 py-1.5 rounded-lg hover:bg-surface-600 text-sm cursor-pointer transition-colors">&gt;</button>
          </div>

          <Button onClick={openNewModal} className="shrink-0">
            <Plus size={16} />
            <span className="hidden sm:inline">New Budget</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No budgets yet"
          description={`You haven't set any budgets for ${monthNames[currentMonth.month - 1]}.`}
          action={<Button onClick={openNewModal}>Create Budget</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget, i) => (
            <div key={budget.id} className={`animate-slide-up delay-${(i % 5) + 1}`} style={{ opacity: 0 }}>
              <BudgetCard
                budget={budget}
                onEdit={(b) => { setEditing(b); setModalOpen(true); }}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? "Edit Budget" : "New Budget"}
      >
        <BudgetForm
          categories={categories}
          initialData={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}
