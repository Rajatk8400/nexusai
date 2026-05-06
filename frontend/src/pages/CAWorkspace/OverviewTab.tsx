import Card from "../../components/ui/Card";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import CustomTooltip from "../../components/charts/CustomTooltip";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";

interface OverviewTabProps {
  data: any;
  loading?: boolean;
}

export default function OverviewTab({ data, loading }: OverviewTabProps) {
  const kpis = data?.kpis ?? {};
  const chartData = data?.revenueChart ?? [];
  const activities = data?.activities ?? [];

  const stats = [
    { label: "Total Purchases", value: `₹${(kpis.totalPurchases || 0).toLocaleString()}`, trend: "Monthly", color: "blue" },
    { label: "Total Sales", value: `₹${(kpis.monthRevenue || 0).toLocaleString()}`, trend: `${kpis.revenueGrowth || 0}%`, color: "emerald" },
    { label: "GST Payable", value: `₹${(kpis.taxPayable || 0).toLocaleString()}`, trend: "Tax", color: "rose" },
    { label: "GST Claimable", value: `₹${(kpis.totalITC || 0).toLocaleString()}`, trend: "ITC", color: "amber" },
    { label: "Monthly Expenses", value: `₹${(kpis.monthExpenses || 0).toLocaleString()}`, trend: "Expense", color: "rose" },
    { label: "Pending Invoices", value: `${kpis.pendingInvoices || 0}`, trend: "Pending", color: "slate" },
    { label: "Profit Overview", value: `₹${(kpis.netProfit || 0).toLocaleString()}`, trend: "Net", color: "cyan" },
    { label: "AI Health Score", value: `${kpis.healthScore || 0}/100`, trend: "Health", color: "indigo" },
  ];

  if (!loading && (!chartData || chartData.length === 0 || chartData.every((d: any) => d.revenue === 0))) {
    return (
      <EmptyState 
        icon="📊"
        title="No Business Data Yet"
        description="Start by creating your first invoice or adding a purchase bill to see your financial analytics."
        actionLabel="Create First Invoice"
        onAction={() => window.location.href = "/sales/new"}
      />
    );
  }

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
                stat.trend.startsWith('+') || parseFloat(stat.trend) > 0 ? 'bg-emerald-50 text-emerald-600' : 
                stat.trend.startsWith('-') || parseFloat(stat.trend) < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
              }`}>
                {stat.trend}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Revenue & Profit Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Performance analysis based on your real transactions</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Revenue</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-blue-500 rounded-full" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Profit</span>
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
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(v) => `₹${v >= 1000 ? v/1000 + 'k' : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
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
                {activities.length > 0 ? (
                  activities.slice(0, 4).map((activity: any, i: number) => (
                    <div key={i} className="flex gap-3 bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer">
                      <span className="text-indigo-400 mt-1 text-xs">•</span>
                      <p className="text-xs font-medium leading-relaxed opacity-90">{activity.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/50 italic py-4">Waiting for your first transaction to generate insights...</p>
                )}
             </div>
          </Card>

          <Card className="p-6">
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Recent Activity</h3>
             <div className="space-y-5">
                {activities.length > 0 ? (
                  activities.map((item: any, i: number) => (
                    <div key={i} className="flex gap-4 relative">
                      {i !== activities.length - 1 && <div className="absolute left-[13px] top-7 bottom-[-20px] w-0.5 bg-slate-100" />}
                      <div className={`w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-xs flex-shrink-0 z-10`}>
                        {item.type === "SALE" ? "💰" : item.type === "PURCHASE" ? "🛒" : "📄"}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.title}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{item.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">No recent activity</p>
                )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
