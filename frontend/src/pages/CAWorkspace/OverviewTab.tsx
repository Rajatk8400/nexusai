import Card from "../../components/ui/Card";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import CustomTooltip from "../../components/charts/CustomTooltip";

interface OverviewTabProps {
  data: any;
}

export default function OverviewTab({ data }: OverviewTabProps) {
  const stats = [
    { label: "Total Purchases", value: "₹4.2L", trend: "+12%", color: "blue" },
    { label: "Total Sales", value: "₹8.5L", trend: "+18%", color: "emerald" },
    { label: "GST Payable", value: "₹1.2L", trend: "-2%", color: "amber" },
    { label: "GST Claimable", value: "₹45K", trend: "+5%", color: "indigo" },
    { label: "Monthly Expenses", value: "₹1.8L", trend: "+8%", color: "rose" },
    { label: "Pending Invoices", value: "24", trend: "-10%", color: "slate" },
    { label: "Profit Overview", value: "₹2.5L", trend: "+15%", color: "cyan" },
    { label: "AI Health Score", value: "88/100", trend: "Stable", color: "violet" },
  ];

  const chartData = [
    { name: "Jan", sales: 4000, purchases: 2400 },
    { name: "Feb", sales: 3000, purchases: 1398 },
    { name: "Mar", sales: 2000, purchases: 9800 },
    { name: "Apr", sales: 2780, purchases: 3908 },
    { name: "May", sales: 1890, purchases: 4800 },
    { name: "Jun", sales: 2390, purchases: 3800 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5 border-none shadow-lg shadow-slate-200/50 bg-white/80 backdrop-blur-sm group hover:scale-[1.02] transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 
                stat.trend.startsWith('-') ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
              }`}>
                {stat.trend}
              </span>
            </div>
            <div className={`mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden`}>
              <div className={`h-full rounded-full bg-${stat.color}-500 transition-all duration-1000`} style={{ width: '60%' }} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Revenue vs Purchases</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 6 months performance comparison</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Sales</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-blue-500 rounded-full" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Purchases</span>
               </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="purchases" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchases)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Alerts & Timeline */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none shadow-xl shadow-indigo-200/50">
             <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
               <span className="p-1.5 bg-white/10 rounded-lg text-indigo-300">✨</span>
               AI Financial Insights
             </h3>
             <div className="space-y-3">
                {[
                  "Possible GST mismatch detected in March invoices.",
                  "Expense on 'Marketing' is 15% higher than usual.",
                  "Eligible for ₹12,400 input tax credit this month.",
                  "Projected cash flow for July looks positive."
                ].map((insight, i) => (
                  <div key={i} className="flex gap-3 bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer">
                    <span className="text-indigo-400 mt-1 text-xs">•</span>
                    <p className="text-xs font-medium leading-relaxed opacity-90">{insight}</p>
                  </div>
                ))}
             </div>
          </Card>

          <Card className="p-6">
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Activity Timeline</h3>
             <div className="space-y-5">
                {[
                  { title: "GST Filed", time: "2 hours ago", icon: "✅", color: "emerald" },
                  { title: "Invoice #1204 Generated", time: "5 hours ago", icon: "📄", color: "blue" },
                  { title: "AI Extraction: AWS Bill", time: "Yesterday", icon: "🤖", color: "indigo" },
                  { title: "Payment Received: ₹24,000", time: "Yesterday", icon: "💰", color: "emerald" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {i !== 3 && <div className="absolute left-[13px] top-7 bottom-[-20px] w-0.5 bg-slate-100" />}
                    <div className={`w-7 h-7 rounded-full bg-${item.color}-50 flex items-center justify-center text-xs flex-shrink-0 z-10`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{item.time}</p>
                    </div>
                  </div>
                ))}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
