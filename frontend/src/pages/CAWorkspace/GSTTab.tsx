import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

export default function GSTTab() {
  const gstSummary = [
    { label: "CGST", payable: "₹45,000", claimable: "₹12,000" },
    { label: "SGST", payable: "₹45,000", claimable: "₹12,000" },
    { label: "IGST", payable: "₹30,000", claimable: "₹21,000" },
  ];

  const chartData = [
    { month: "Jan", payable: 120, claimable: 80 },
    { month: "Feb", payable: 90, claimable: 110 },
    { month: "Mar", payable: 150, claimable: 130 },
    { month: "Apr", payable: 110, claimable: 90 },
    { month: "May", payable: 140, claimable: 100 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">GST Filing Analytics</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly comparison of Tax Payable vs Claimable</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-indigo-600 rounded-full" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Payable</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Claimable</span>
               </div>
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(v) => `₹${v}k`} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="payable" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="claimable" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900 text-white border-none shadow-xl">
           <h3 className="text-xs font-black uppercase tracking-widest mb-6">Filing Readiness</h3>
           <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs font-bold text-slate-400">GSTR-1 (Sales)</p>
                  <p className="text-sm font-black text-emerald-400">Ready</p>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs font-bold text-slate-400">GSTR-3B (Summary)</p>
                  <p className="text-sm font-black text-amber-400">85% Complete</p>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div className="pt-4 space-y-4">
                 <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Upcoming Deadline</p>
                    <p className="text-sm font-bold">20 June 2024 (GSTR-3B)</p>
                 </div>
                 <Button variant="primary" fullWidth size="sm">Download GSTR-1 JSON</Button>
              </div>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tax Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                     <tr>
                        <th className="px-6 py-4">Component</th>
                        <th className="px-6 py-4">Payable</th>
                        <th className="px-6 py-4">Claimable (ITC)</th>
                        <th className="px-6 py-4 text-right">Net</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {gstSummary.map((gst) => (
                        <tr key={gst.label} className="text-sm hover:bg-slate-50/30">
                           <td className="px-6 py-4 font-bold text-slate-700">{gst.label}</td>
                           <td className="px-6 py-4 text-slate-600 font-medium">{gst.payable}</td>
                           <td className="px-6 py-4 text-emerald-600 font-bold">{gst.claimable}</td>
                           <td className="px-6 py-4 text-right font-black text-slate-800">
                             ₹{ (parseInt(gst.payable.replace(/[^0-9]/g, '')) - parseInt(gst.claimable.replace(/[^0-9]/g, ''))).toLocaleString() }
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </Card>

         <Card className="p-6 border-l-4 border-l-rose-500">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
                 ⚠️
               </div>
               <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">AI Mismatch Alerts</h3>
                  <p className="text-xs text-slate-400">Potentially missing tax credits or filing errors</p>
               </div>
            </div>
            <div className="space-y-3">
               <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                  <p className="text-xs font-bold text-rose-800 mb-1">GSTR-2B Mismatch</p>
                  <p className="text-xs text-rose-600 leading-relaxed">
                    Vendor <span className="font-bold">Nexus Tech Solutions</span> has not filed GSTR-1. ₹4,200 ITC cannot be claimed yet.
                  </p>
                  <Button variant="secondary" size="sm" className="mt-3 bg-white border-rose-200 text-rose-700 hover:bg-rose-50">Contact Vendor</Button>
               </div>
               <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-800 mb-1">Duplicate Invoice Detection</p>
                  <p className="text-xs text-amber-600 leading-relaxed">
                    Invoice <span className="font-bold">#9920</span> for ₹12,000 appears to be a duplicate of #9918.
                  </p>
                  <Button variant="secondary" size="sm" className="mt-3 bg-white border-amber-200 text-amber-700 hover:bg-amber-50">Resolve Mismatch</Button>
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
}
