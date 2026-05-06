import { useState, useEffect, useRef } from "react";
import { documentApi } from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

type DocType = "BILL" | "INVOICE" | "AGREEMENT" | "GST" | "ALL";

export default function DocumentVaultPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [filter, setFilter] = useState<DocType>("ALL");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [filter]);

  async function loadDocuments() {
    try {
      setLoading(true);
      const data = await documentApi.list(filter === "ALL" ? undefined : filter);
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // Default to the current filter type if it's not "ALL"
      const uploadType = filter === "ALL" ? "BILL" : filter;
      await documentApi.upload(file, uploadType);
      loadDocuments();
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSendToCa() {
    if (selectedDocs.length === 0) return;
    try {
      await documentApi.sendToCa(selectedDocs);
      setSelectedDocs([]);
      loadDocuments();
      alert("Documents marked as Sent to CA!");
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await documentApi.delete(id);
      loadDocuments();
    } catch (e) {
      console.error(e);
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            AI Document Engine
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase rounded-full">Automation</span>
          </h1>
          <p className="text-slate-500 text-sm">Upload records and let AI extract billing & GST details</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <Button 
            variant="primary" 
            disabled={selectedDocs.length === 0}
            onClick={handleSendToCa}
          >
            Send {selectedDocs.length > 0 ? `(${selectedDocs.length})` : ""} to CA
          </Button>
        </div>
      </div>

      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        {["ALL", "BILL", "INVOICE", "GST", "AGREEMENT"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t as DocType)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              filter === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && documents.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-bold">Scanning Document Vault...</p>
        </div>
      ) : documents.length === 0 ? (
        <Card className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-4">📂</div>
          <h3 className="text-lg font-black text-slate-800">No documents found</h3>
          <p className="text-slate-500 text-sm max-w-xs mt-2">Upload your first bill, invoice or GST document to start the AI extraction process.</p>
          <Button variant="primary" className="mt-6" onClick={() => fileInputRef.current?.click()}>Upload Now</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <Card className="overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      onChange={(e) => setSelectedDocs(e.target.checked ? documents.map(d => d.id) : [])}
                      checked={selectedDocs.length === documents.length && documents.length > 0}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-6 py-4">Document Details</th>
                  <th className="px-6 py-4">AI Extraction Results</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map(doc => (
                  <tr key={doc.id} className={`text-sm hover:bg-slate-50/50 transition-colors ${selectedDocs.includes(doc.id) ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-6 py-4 text-center">
                       <input 
                        type="checkbox" 
                        checked={selectedDocs.includes(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg">
                          {doc.type === "BILL" ? "🧾" : doc.type === "INVOICE" ? "📄" : doc.type === "GST" ? "🏛️" : "📁"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{doc.fileName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{doc.type} • {(doc.fileSize / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {doc.status === "EXTRACTED" || doc.status === "SENT_TO_CA" ? (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <p className="text-[10px] font-bold text-slate-400">VENDOR: <span className="text-slate-700">{doc.extractedData?.vendorName}</span></p>
                          <p className="text-[10px] font-bold text-slate-400">DATE: <span className="text-slate-700">{new Date(doc.extractedData?.date).toLocaleDateString()}</span></p>
                          <p className="text-[10px] font-bold text-slate-400">AMOUNT: <span className="text-indigo-600">₹{doc.extractedData?.totalAmount}</span></p>
                          <p className="text-[10px] font-bold text-slate-400">GSTIN: <span className="text-slate-700">{doc.extractedData?.gstin}</span></p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 italic text-xs">
                          <div className="w-3 h-3 border-2 border-slate-200 border-t-indigo-400 rounded-full animate-spin" />
                          AI is analyzing...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        doc.status === "SENT_TO_CA" ? "bg-emerald-100 text-emerald-600" :
                        doc.status === "EXTRACTED" ? "bg-blue-100 text-blue-600" :
                        doc.status === "FAILED" ? "bg-red-100 text-red-600" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {doc.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => window.open(`http://localhost:4000${doc.fileUrl}`, "_blank")}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                          title="View Document"
                        >
                          👁️
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          
          <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">🤖</div>
              <div>
                <p className="text-sm font-black text-indigo-900">AI Document Engine Tip</p>
                <p className="text-xs text-indigo-700">You can upload batch files and let the AI process them in the background. Once extracted, just select all and click "Send to CA".</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
