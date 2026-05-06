import { useState, useEffect, useRef } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { FileIcon, SparkleIcon, DownloadIcon, PlusIcon, XIcon } from "../../components/ui/Icons";
import { documentApi } from "../../services/api";
import EmptyState from "../../components/ui/EmptyState";

export default function DocumentsTab() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      const data = await documentApi.list();
      setDocuments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleUpload = () => {
    setUploading(true);
    setExtractedData(null);
    
    // Simulate AI extraction delay
    setTimeout(() => {
      setUploading(false);
      setExtractedData({
        vendorName: "DigitalOcean LLC",
        gstin: "27AADCD1234F1Z5",
        invoiceNumber: "INV-2024-05-99",
        date: "2024-05-01",
        taxAmount: "₹1,240.00",
        totalAmount: "₹8,240.00",
        confidence: 0.98
      });
    }, 3000);
  };

  if (!loading && documents.length === 0 && !uploading && !extractedData) {
    return (
      <EmptyState 
        icon="📄"
        title="Digital Vault is Empty"
        description="Upload your purchase bills, GST certificates, and business agreements to manage them securely with AI extraction."
        actionLabel="Upload First Document"
        onAction={() => document.getElementById('bill-upload')?.click()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-6">
          <Card className="p-10 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/30 hover:bg-white hover:border-indigo-300 transition-all cursor-pointer group">
             <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
               <FileIcon size={32} className="text-indigo-600" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-800">AI Bill Upload</h3>
               <p className="text-xs text-slate-500 max-w-xs mx-auto">Upload PDF or Image of your bills. Our AI will automatically extract all accounting details.</p>
             </div>
             <input type="file" className="hidden" id="bill-upload" onChange={handleUpload} />
             <Button variant="primary" onClick={() => document.getElementById('bill-upload')?.click()} disabled={uploading}>
               {uploading ? "AI Processing..." : "Select Document"}
             </Button>
          </Card>

          {/* OCR Processing / Extracted Data */}
          {uploading && (
            <Card className="p-6 overflow-hidden relative">
              <div className="absolute inset-0 bg-indigo-600/5 animate-pulse" />
              <div className="relative flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                   <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                 </div>
                 <div>
                   <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Running AI OCR</h4>
                   <p className="text-xs text-slate-500">Extracting vendor, tax, and invoice details...</p>
                 </div>
              </div>
            </Card>
          )}

          {extractedData && (
            <Card className="p-0 overflow-hidden border-2 border-emerald-500/20 shadow-xl shadow-emerald-100/50">
               <div className="px-6 py-4 bg-emerald-500 text-white flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <span>✨</span> AI Extraction Successful
                  </h3>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">98% Confidence</span>
               </div>
               <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Name</p>
                        <p className="text-sm font-bold text-slate-800">{extractedData.vendorName}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Number</p>
                        <p className="text-sm font-bold text-slate-800">{extractedData.gstin}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice #</p>
                        <p className="text-sm font-bold text-slate-800">{extractedData.invoiceNumber}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                        <p className="text-sm font-bold text-slate-800">{extractedData.date}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax Amount</p>
                        <p className="text-sm font-black text-emerald-600">{extractedData.taxAmount}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                        <p className="text-sm font-black text-slate-800">{extractedData.totalAmount}</p>
                     </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex gap-2">
                     <Button variant="primary" size="sm" className="flex-1" onClick={() => { setExtractedData(null); loadDocuments(); }}>Save Entry</Button>
                     <Button variant="secondary" size="sm" className="flex-1" onClick={() => setExtractedData(null)}>Discard</Button>
                  </div>
               </div>
            </Card>
          )}
        </div>

        {/* Documents Table */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Document Center</h3>
             <div className="flex gap-2">
               <Button variant="secondary" size="sm" className="h-8"><DownloadIcon size={14} /></Button>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc, idx) => (
                  <tr key={idx} className="text-sm hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                           <FileIcon size={16} />
                         </div>
                         <span className="font-bold text-slate-700 truncate max-w-[150px]">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{doc.type}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-600">
                        Stored
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-400 font-medium">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
