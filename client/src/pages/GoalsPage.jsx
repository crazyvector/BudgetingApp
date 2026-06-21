import { useState, useEffect, useCallback } from "react";
import GoalCard from "../components/goals/GoalCard.jsx";
import GoalForm from "../components/goals/GoalForm.jsx";
import ContributionForm from "../components/goals/ContributionForm.jsx";
import Modal from "../components/ui/Modal.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { Plus, Target } from "lucide-react";
import toast from "react-hot-toast";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addGoalContribution,
} from "../api/goals.js";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [formLoading, setFormLoading] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  
  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGoals();
      setGoals(data);
    } catch (err) {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  async function handleGoalSubmit(data) {
    try {
      setFormLoading(true);
      if (editingGoal) {
        await updateGoal(editingGoal.id, data);
        toast.success("Goal updated");
      } else {
        await createGoal(data);
        toast.success("Goal created");
      }
      setGoalModalOpen(false);
      setEditingGoal(null);
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this goal and all its contributions?")) return;
    try {
      await deleteGoal(id);
      toast.success("Goal deleted");
      fetchGoals();
    } catch (err) {
      toast.error("Failed to delete goal");
    }
  }

  async function handleContributionSubmit(data) {
    try {
      setFormLoading(true);
      await addGoalContribution(activeGoal.id, data);
      toast.success("Funds added!");
      setContribModalOpen(false);
      setActiveGoal(null);
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  function openNewGoalModal() {
    setEditingGoal(null);
    setGoalModalOpen(true);
  }

  function openContributionModal(goal) {
    setActiveGoal(goal);
    setContribModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Savings Goals
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Track and reach your financial targets
          </p>
        </div>
        <Button onClick={openNewGoalModal} className="shrink-0">
          <Plus size={16} />
          New Goal
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set a target like a new car, vacation, or emergency fund to start saving."
          action={<Button onClick={openNewGoalModal}>Create Goal</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {goals.map((goal, i) => (
            <div key={goal.id} className={`animate-slide-up delay-${(i % 5) + 1}`} style={{ opacity: 0 }}>
              <GoalCard
                goal={goal}
                onEdit={(g) => { setEditingGoal(g); setGoalModalOpen(true); }}
                onDelete={handleDelete}
                onAddContribution={openContributionModal}
              />
            </div>
          ))}
        </div>
      )}

      {/* Goal Form Modal */}
      <Modal
        isOpen={goalModalOpen}
        onClose={() => { setGoalModalOpen(false); setEditingGoal(null); }}
        title={editingGoal ? "Edit Goal" : "New Savings Goal"}
      >
        <GoalForm
          initialData={editingGoal}
          onSubmit={handleGoalSubmit}
          onCancel={() => { setGoalModalOpen(false); setEditingGoal(null); }}
          loading={formLoading}
        />
      </Modal>

      {/* Contribution Form Modal */}
      <Modal
        isOpen={contribModalOpen}
        onClose={() => { setContribModalOpen(false); setActiveGoal(null); }}
        title="Add Funds"
      >
        {activeGoal && (
          <ContributionForm
            goal={activeGoal}
            onSubmit={handleContributionSubmit}
            onCancel={() => { setContribModalOpen(false); setActiveGoal(null); }}
            loading={formLoading}
          />
        )}
      </Modal>
    </div>
  );
}
