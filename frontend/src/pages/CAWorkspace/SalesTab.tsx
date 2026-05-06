import { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { PlusIcon, DownloadIcon } from "../../components/ui/Icons";
import { saleApi } from "../../services/api";
import EmptyState from "../../components/ui/EmptyState";

export default function SalesTab() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    try {
      setLoading(true);
      const res = await saleApi.list();
      setSales(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (!loading && sales.length === 0) {
    return (
      <EmptyState 
        icon="💰"
        title="No Sales Invoices Yet"
        description="Generate your first professional GST invoice and start tracking your business revenue."
        actionLabel="Create First Invoice"
        onAction={() => window.location.href = "/sales/new"}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
             <div>
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Sales & GST Invoices</h3>
               <p className="text-xs text-slate-400 mt-0.5">Manage customer billing and tax records</p>
             </div>
             <Button variant="primary" size="sm" className="flex items-center gap-2" onClick={() => window.location.href = "/sales/new"}>
               <PlusIcon size={14} /> Create GST Invoice
             </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((row, idx) => (
                  <tr key={idx} className="text-sm hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.invoiceNumber}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{row.customerName || "Walk-in"}</td>
                    <td className="px-6 py-4 font-black text-slate-800">₹{row.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        row.paymentStatus === "COMPLETED" ? "bg-emerald-100 text-emerald-600" :
                        row.paymentStatus === "PENDING" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                      }`}>
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"><DownloadIcon size={14} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
           <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
             <span>💡</span> AI Invoice Suggestions
           </h3>
           <div className="space-y-4">
              <p className="text-xs text-slate-500 italic">Analyzing your sales patterns... more insights will appear as you create more invoices.</p>
           </div>
        </Card>
      </div>
    </div>
  );
}
