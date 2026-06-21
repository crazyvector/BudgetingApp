import { useState, useEffect, useCallback } from "react";
import TransactionForm from "../components/transactions/TransactionForm.jsx";
import TransactionFilters from "../components/transactions/TransactionFilters.jsx";
import TransactionList from "../components/transactions/TransactionList.jsx";
import Modal from "../components/ui/Modal.jsx";
import ImportModal from "../components/ui/ImportModal.jsx";
import Button from "../components/ui/Button.jsx";
import { Plus, Download, Upload } from "lucide-react";
import toast from "react-hot-toast";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../api/transactions.js";
import { getCategories } from "../api/categories.js";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    type: "",
    categoryId: "",
    startDate: "",
    endDate: "",
    search: "",
    sortBy: "date",
    sortOrder: "desc",
  });
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Fetch transactions with current filters
  const fetchTransactions = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = { page, limit: 15 };
        if (filters.type) params.type = filters.type;
        if (filters.categoryId) params.categoryId = filters.categoryId;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.search) params.search = filters.search;
        if (filters.sortBy) params.sortBy = filters.sortBy;
        if (filters.sortOrder) params.sortOrder = filters.sortOrder;

        const result = await getTransactions(params);
        setTransactions(result.data);
        setPagination(result.pagination);
      } catch (err) {
        toast.error("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Fetch categories on mount
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  // Re-fetch on filter change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  async function handleSubmit(data) {
    try {
      setFormLoading(true);
      if (editing) {
        await updateTransaction(editing.id, data);
        toast.success("Transaction updated");
      } else {
        await createTransaction(data);
        toast.success("Transaction added");
      }
      setModalOpen(false);
      setEditing(null);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteTransaction(id);
      toast.success("Transaction deleted");
      fetchTransactions();
    } catch (err) {
      toast.error("Failed to delete");
    }
  }

  function handleEdit(tx) {
    setEditing(tx);
    setModalOpen(true);
  }

  function openNewModal() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleExportCSV() {
    if (transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = ["ID", "Date", "Description", "Category", "Type", "Amount"];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.date.split("T")[0],
      `"${(tx.description || tx.category?.name || "").replace(/"/g, '""')}"`,
      `"${tx.category?.name || ""}"`,
      tx.type,
      tx.amount,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((e) => e.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported successfully");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Transaction History
          </h2>
          <p className="text-sm text-text-muted">
            {pagination ? `${pagination.total} total transactions` : "Loading..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportModalOpen(true)} title="Import CSV/PDF">
            <Upload size={16} />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button variant="secondary" onClick={handleExportCSV} title="Export to CSV">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button onClick={openNewModal}>
            <Plus size={16} />
            <span className="hidden sm:inline">Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters
        categories={categories}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <TransactionList
          transactions={transactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={(page) => fetchTransactions(page)}
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit Transaction" : "New Transaction"}
      >
        <TransactionForm
          categories={categories}
          initialData={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          loading={formLoading}
        />
      </Modal>

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => fetchTransactions()}
      />
    </div>
  );
}
