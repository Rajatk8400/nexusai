import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { DownloadIcon, PlusIcon } from "../../components/ui/Icons";

export default function PurchasesTab() {
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
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Tax (GST)</th>
                <th className="px-6 py-4">Claim Status</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { inv: "PUR-8820", vendor: "Tech Wholesale Corp", total: "₹1,24,000", tax: "₹22,320", status: "Claimed", date: "24 May 2024" },
                { inv: "PUR-8821", vendor: "Global Logistics", total: "₹45,200", tax: "₹8,136", status: "Pending", date: "22 May 2024" },
                { inv: "PUR-8822", vendor: "Office Depot", total: "₹12,500", tax: "₹2,250", status: "Claimed", date: "21 May 2024" },
                { inv: "PUR-8823", vendor: "A1 Stationary", total: "₹5,400", tax: "₹972", status: "Mismatched", date: "20 May 2024" },
                { inv: "PUR-8824", vendor: "Server Hosting", total: "₹8,200", tax: "₹1,476", status: "Claimed", date: "18 May 2024" },
              ].map((row, idx) => (
                <tr key={idx} className="text-sm hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{row.inv}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{row.vendor}</td>
                  <td className="px-6 py-4 font-black text-slate-800">{row.total}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{row.tax}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      row.status === "Claimed" ? "bg-emerald-100 text-emerald-600" :
                      row.status === "Pending" ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-slate-400 font-medium">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
