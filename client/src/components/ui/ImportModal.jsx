import { useState, useRef } from "react";
import Button from "./Button.jsx";
import { UploadCloud, FileText, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/client.js"; // adjust path as needed

export default function ImportModal({ isOpen, onClose, onImported, accounts = [] }) {
  const [file, setFile] = useState(null);
  const [bank, setBank] = useState("revolut"); // "revolut" or "bt"
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  function handleFileDrop(e) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }

  function handleFileSelect(e) {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  async function handleImport() {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bank", bank);

    try {
      const response = await api.post("/transactions/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`Successfully imported ${response.data.count} transactions!`);
      setFile(null);
      if (onImported) onImported();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Import failed. Please check the file format.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md bg-surface-primary border border-border-light rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-1">Import Transactions</h2>
          <p className="text-sm text-text-muted mb-6">Upload your bank statement to import transactions automatically.</p>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setBank("revolut")}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                bank === "revolut"
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-border-light bg-surface-secondary text-text-muted hover:border-brand-300"
              }`}
            >
              Revolut (CSV)
            </button>
            <button
              onClick={() => setBank("bt")}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                bank === "bt"
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-border-light bg-surface-secondary text-text-muted hover:border-brand-300"
              }`}
            >
              BT (PDF)
            </button>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
              file ? "border-brand-400 bg-brand-50/50" : "border-border-light hover:border-brand-400 bg-surface-secondary"
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv,.xlsx,.pdf"
              className="hidden"
            />
            
            {file ? (
              <>
                <CheckCircle className="w-10 h-10 text-brand-500 mb-3" />
                <p className="font-medium text-text-primary">{file.name}</p>
                <p className="text-xs text-text-muted mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-text-muted mb-3" />
                <p className="font-medium text-text-primary">Click or drag file here</p>
                <p className="text-xs text-text-muted mt-1">Accepts .csv (Revolut) or .pdf (BT)</p>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!file || loading}>
              {loading ? "Importing..." : "Import Data"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
