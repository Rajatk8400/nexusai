import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { PlusIcon, DownloadIcon } from "../../components/ui/Icons";

export default function SalesTab() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
             <div>
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Sales & GST Invoices</h3>
               <p className="text-xs text-slate-400 mt-0.5">Manage customer billing and tax records</p>
             </div>
             <Button variant="primary" size="sm" className="flex items-center gap-2">
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
                {[
                  { inv: "INV-1024", customer: "Rahul Sharma", total: "₹24,500", status: "Paid" },
                  { inv: "INV-1025", customer: "Priya Gupta", total: "₹12,200", status: "Pending" },
                  { inv: "INV-1026", customer: "Tech Solutions Inc", total: "₹85,000", status: "Paid" },
                  { inv: "INV-1027", customer: "Amit Patel", total: "₹5,400", status: "Paid" },
                  { inv: "INV-1028", customer: "Sana Khan", total: "₹3,200", status: "Cancelled" },
                ].map((row, idx) => (
                  <tr key={idx} className="text-sm hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.inv}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{row.customer}</td>
                    <td className="px-6 py-4 font-black text-slate-800">{row.total}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        row.status === "Paid" ? "bg-emerald-100 text-emerald-600" :
                        row.status === "Pending" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"><DownloadIcon size={14} /></button>
                          <button className="text-[10px] font-bold text-indigo-600 hover:underline">WhatsApp</button>
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
              <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                 <p className="text-xs font-bold text-slate-800 mb-1">Upcoming Renewal</p>
                 <p className="text-[10px] text-slate-500 mb-3">Customer <span className="font-bold">Tech Solutions Inc</span> usually renews their license on June 1st.</p>
                 <Button variant="primary" size="sm" fullWidth>Draft Invoice</Button>
              </div>
              <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm opacity-60">
                 <p className="text-xs font-bold text-slate-800 mb-1">Payment Reminder</p>
                 <p className="text-[10px] text-slate-500 mb-3"><span className="font-bold">Priya Gupta</span>'s invoice is 3 days overdue.</p>
                 <Button variant="secondary" size="sm" fullWidth>Send WhatsApp</Button>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
