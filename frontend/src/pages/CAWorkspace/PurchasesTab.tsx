import { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { DownloadIcon, PlusIcon } from "../../components/ui/Icons";
import { purchaseApi } from "../../services/api";
import EmptyState from "../../components/ui/EmptyState";

export default function PurchasesTab() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchases();
  }, []);

  async function loadPurchases() {
    try {
      setLoading(true);
      const res = await purchaseApi.list();
      setPurchases(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (!loading && purchases.length === 0) {
    return (
      <EmptyState 
        icon="🛒"
        title="No Purchases Recorded"
        description="Record your first purchase bill to track inventory costs and claim GST input tax credit."
        actionLabel="Add Purchase Bill"
        onAction={() => {}}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
           <div>
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Purchase Records</h3>
             <p className="text-xs text-slate-400 mt-0.5">Track all stock-in entries and GST compliance</p>
           </div>
           <div className="flex gap-2">
             <Button variant="secondary" size="sm">Export CSV</Button>
             <Button variant="primary" size="sm" className="flex items-center gap-2">
               <PlusIcon size={14} /> New Purchase
             </Button>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Purchase #</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Tax (GST)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((row, idx) => (
                <tr key={idx} className="text-sm hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{row.purchaseNumber}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{row.supplierId?.name || "Supplier"}</td>
                  <td className="px-6 py-4 font-black text-slate-800">₹{row.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">₹{row.taxAmount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-600`}>
                      {row.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-slate-400 font-medium">{new Date(row.purchaseDateAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
