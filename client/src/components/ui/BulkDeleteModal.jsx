import { useState } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import { bulkDeleteTransactions } from "../../api/transactions.js";
import toast from "react-hot-toast";

export default function BulkDeleteModal({ isOpen, onClose, onDeleted }) {
  const [filterType, setFilterType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (filterType === "range" && (!startDate || !endDate)) {
      toast.error("Please select both start and end dates.");
      return;
    }

    if (!window.confirm("Are you SURE you want to delete these transactions? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      const payload = {};
      if (filterType === "range") {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }
      
      const res = await bulkDeleteTransactions(payload);
      toast.success(`Deleted ${res.count} transactions successfully!`);
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete transactions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Delete Transactions">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          Warning: Deleted transactions cannot be recovered. Your category budgets will be automatically recalculated.
        </p>
        
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Delete Scope
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field"
          >
            <option value="all">Delete ALL Transactions</option>
            <option value="range">Delete by Date Range</option>
          </select>
        </div>

        {filterType === "range" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
