import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ExpensesTab() {
  const categories = [
    { name: "Rent", amount: "₹30,000", count: 1, trend: "Stable" },
    { name: "Marketing", amount: "₹45,200", count: 12, trend: "+15%" },
    { name: "Salary", amount: "₹1,20,000", count: 5, trend: "Stable" },
    { name: "AWS / Tech", amount: "₹12,400", count: 3, trend: "-5%" },
    { name: "Others", amount: "₹8,500", count: 8, trend: "+2%" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {categories.map((cat) => (
          <Card key={cat.name} className="p-4 border-none shadow-md bg-white">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{cat.name}</p>
            <p className="text-lg font-black text-slate-800">{cat.amount}</p>
            <div className="flex justify-between items-center mt-2">
               <span className="text-[10px] text-slate-400 font-bold">{cat.count} bills</span>
               <span className={`text-[9px] font-black ${cat.trend.startsWith('+') ? 'text-rose-500' : cat.trend === 'Stable' ? 'text-slate-400' : 'text-emerald-500'}`}>
                 {cat.trend}
               </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 p-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Expense Analytics</h3>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Week 1', amt: 2400 },
                    { name: 'Week 2', amt: 1398 },
                    { name: 'Week 3', amt: 9800 },
                    { name: 'Week 4', amt: 3908 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="amt" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={3} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </Card>

         <Card className="p-6 bg-slate-50 border-slate-200">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
               <span>📉</span> Monthly Trends
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-bold text-slate-600">Operating Cost</span>
                  <span className="text-xs font-black text-slate-800">₹1.8L</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-bold text-slate-600">Tax Liabilities</span>
                  <span className="text-xs font-black text-slate-800">₹45k</span>
               </div>
               <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 mt-6">
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">AI Savings Tip</p>
                  <p className="text-xs text-emerald-600 leading-relaxed font-medium">
                    Switching to annual billing for AWS could save you <span className="font-bold">₹12,000</span> per year.
                  </p>
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
}
