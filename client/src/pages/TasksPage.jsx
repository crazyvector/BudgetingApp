import { useState, useEffect, useCallback } from "react";
import TaskItem from "../components/tasks/TaskItem.jsx";
import TaskForm from "../components/tasks/TaskForm.jsx";
import Modal from "../components/ui/Modal.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { Plus, CheckSquare } from "lucide-react";
import toast from "react-hot-toast";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../api/tasks.js";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all tasks and filter client-side for simplicity, or use the query parameter
      const data = await getTasks(showCompleted ? {} : { completed: false });
      setTasks(data);
    } catch (err) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [showCompleted]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleSubmit(data) {
    try {
      setFormLoading(true);
      if (editing) {
        await updateTask(editing.id, data);
        toast.success("Task updated");
      } else {
        await createTask(data);
        toast.success("Task created");
      }
      setModalOpen(false);
      setEditing(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      toast.success("Task deleted");
      fetchTasks();
    } catch (err) {
      toast.error("Failed to delete task");
    }
  }

  async function handleToggle(task) {
    try {
      await updateTask(task.id, { completed: !task.completed });
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
      );
      if (!task.completed) toast.success("Task completed!");
    } catch (err) {
      toast.error("Failed to update task");
      fetchTasks(); // Revert on failure
    }
  }

  function openNewModal() {
    setEditing(null);
    setModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Financial Tasks
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Keep track of bills, subscriptions, and to-dos
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-glass-border bg-surface-700 text-brand-500 focus:ring-brand-500/20"
            />
            Show Completed
          </label>

          <Button onClick={openNewModal} className="shrink-0">
            <Plus size={16} />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="All caught up!"
          description="You don't have any pending tasks. Enjoy your day or add a new one."
          action={<Button onClick={openNewModal}>Add Task</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task, i) => (
            <div key={task.id} className={`animate-slide-up delay-${(i % 5) + 1}`} style={{ opacity: 0 }}>
              <TaskItem
                task={task}
                onToggle={handleToggle}
                onEdit={(t) => { setEditing(t); setModalOpen(true); }}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? "Edit Task" : "New Task"}
      >
        <TaskForm
          initialData={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}
