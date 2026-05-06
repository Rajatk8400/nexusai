import { useState, useEffect } from "react";
import { aiApi } from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend, LineChart, Line
} from "recharts";
import CustomTooltip from "../../components/charts/CustomTooltip";

type Tab = "summary" | "inventory" | "revenue" | "staff";

export default function AIInsightsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [inventoryInsights, setInventoryInsights] = useState<any[]>([]);
  const [revenueForecast, setRevenueForecast] = useState<any>(null);
  const [staffProductivity, setStaffProductivity] = useState<any[]>([]);
  const [businessInsights, setBusinessInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      const [inv, rev, staff, biz] = await Promise.all([
        aiApi.getInventoryInsights(),
        aiApi.getRevenueForecast(30),
        aiApi.getStaffProductivity(),
        aiApi.getBusinessInsights()
      ]);
      setInventoryInsights(inv);
      setRevenueForecast(rev);
      setStaffProductivity(staff);
      setBusinessInsights(biz);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function fmtINR(n: number): string {
    if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr";
    if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
    if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
    return "₹" + n.toFixed(0);
  }

  const criticalItems = inventoryInsights.filter(i => i.status === "CRITICAL");
  const warningItems = inventoryInsights.filter(i => i.status === "WARNING");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            AI Business Insights
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-full">Beta</span>
          </h1>
          <p className="text-slate-500 text-sm">Advanced predictive analytics for your business</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-center">
          {[
            { id: "summary", label: "Overview", icon: "✨" },
            { id: "inventory", label: "Stock", icon: "📦" },
            { id: "revenue", label: "Revenue", icon: "💰" },
            { id: "staff", label: "Staff", icon: "👥" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === t.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-bold animate-pulse">Running AI models on your data...</p>
        </div>
      ) : (
        <>
          {activeTab === "summary" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-200/50">
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <span className="bg-white/20 p-1.5 rounded-lg text-lg">💡</span>
                    AI Executive Summary
                  </h3>
                  <div className="space-y-3">
                    {businessInsights?.insights?.map((insight: string, idx: number) => (
                      <div key={idx} className="flex gap-3 bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                        <span className="text-blue-200 mt-0.5">•</span>
                        <p className="text-sm font-medium leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="p-5 border-l-4 border-l-red-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical Stock Alerts</p>
                    <p className="text-3xl font-black text-slate-800">{criticalItems.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Products running out in &lt; 7 days</p>
                    <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => setActiveTab("inventory")}>View Stock Insights</Button>
                  </Card>
                  <Card className="p-5 border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Performer</p>
                    <p className="text-3xl font-black text-slate-800 truncate">{staffProductivity[0]?.staffName || "—"}</p>
                    <p className="text-xs text-slate-500 mt-1">Highest revenue generated this month</p>
                    <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => setActiveTab("staff")}>View Staff Metrics</Button>
                  </Card>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Quick Stats</h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">30D Projected Revenue</p>
                      <p className="text-2xl font-black text-blue-600">
                        {fmtINR(revenueForecast?.predictions?.reduce((sum: number, p: any) => sum + p.revenue, 0) || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Business Health Score</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                        </div>
                        <span className="text-sm font-black text-slate-800">85%</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Avg Ticket Size</span>
                        <span className="text-xs font-bold text-slate-800">₹{businessInsights?.metrics?.avgTicket?.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Busiest Day</span>
                        <span className="text-xs font-bold text-slate-800">{businessInsights?.metrics?.bestDay}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "inventory" && (
            <Card className="overflow-hidden border-none shadow-xl">
              <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Inventory Health & Predictions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Predictive stock management based on sales velocity</p>
                </div>
                <Button onClick={loadAllData} variant="secondary" size="sm">Refresh Model</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Product / SKU</th>
                      <th className="px-6 py-4 text-center">Velocity (Unit/Day)</th>
                      <th className="px-6 py-4 text-center">Days Remaining</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">AI Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventoryInsights.map(i => (
                      <tr key={i.productId} className="text-sm hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{i.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono uppercase">{i.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-slate-600">
                          {i.dailyVelocity}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-black ${
                            i.status === "CRITICAL" ? "text-red-600" : 
                            i.status === "WARNING" ? "text-amber-600" : "text-slate-800"
                          }`}>
                            {i.daysRemaining} days
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            i.status === "CRITICAL" ? "bg-red-100 text-red-600" :
                            i.status === "WARNING" ? "bg-amber-100 text-amber-600" :
                            i.status === "EXCESS" ? "bg-blue-100 text-blue-600" :
                            "bg-emerald-100 text-emerald-600"
                          }`}>
                            {i.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {i.status === "CRITICAL" || i.status === "WARNING" ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Buy {i.suggestedOrder} units</span>
                              <Button size="sm" variant="primary" onClick={() => window.location.href = "/purchases"}>Order Now</Button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Maintain current levels</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === "revenue" && (
            <div className="space-y-6">
              <Card className="p-6 h-[400px]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">30-Day Revenue Forecast</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Trend-based prediction with best/worst case scenarios</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500">Predicted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-200 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500">Confidence Range</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={revenueForecast?.predictions || []}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: '#94a3b8' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#94a3b8' }} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip content={<CustomTooltip formatter={fmtINR} />} />
                    <Area 
                      type="monotone" 
                      dataKey="bestCase" 
                      stroke="none" 
                      fill="#dbeafe" 
                      fillOpacity={0.5} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="worstCase" 
                      stroke="none" 
                      fill="#fff" 
                      fillOpacity={1} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorRev)" 
                      dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Growth Projection</h3>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Based on the last 90 days of sales, your business is showing a 
                      <span className="font-black text-emerald-600 mx-1">stable growth</span> 
                      trend. AI predicts a <span className="font-bold text-slate-800">5-8% increase</span> in order volume next month.
                    </p>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                        <span>📈</span>
                        Recommended Action: Increase inventory levels for top-selling items by 10% to prevent stockouts.
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Forecast Confidence</h3>
                  <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-blue-600" strokeDasharray={`${Math.round((revenueForecast?.confidenceScore || 0) * 100)}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-black text-slate-800">{Math.round((revenueForecast?.confidenceScore || 0) * 100)}%</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800 mb-1">Model Accuracy</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        This forecast has a high confidence level based on your consistent sales patterns over the past 3 months.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "staff" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {staffProductivity.slice(0, 4).map((staff, idx) => (
                  <Card key={staff.staffId} className="p-5 relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-110 ${
                      idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-blue-500'
                    }`} />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${
                          idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-blue-500'
                        }`}>
                          {staff.staffName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{staff.staffName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {idx === 0 ? '🏆 Top Performer' : 'Staff Member'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <p className="text-xs text-slate-400">Total Sales</p>
                          <p className="text-lg font-black text-slate-800">{fmtINR(staff.totalRevenue)}</p>
                        </div>
                        <div className="pt-3 border-t border-slate-50 flex justify-between text-center">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black">Orders</p>
                            <p className="text-sm font-black text-slate-700">{staff.orderCount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black">Efficiency</p>
                            <p className="text-sm font-black text-blue-600">{staff.efficiencyScore}%</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black">Avg Bill</p>
                            <p className="text-sm font-black text-slate-700">₹{staff.avgOrderValue.toFixed(0)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Complete Staff Performance Report</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Staff Member</th>
                        <th className="px-6 py-4 text-center">Invoices</th>
                        <th className="px-6 py-4 text-center">Total Revenue</th>
                        <th className="px-6 py-4 text-center">Avg Transaction</th>
                        <th className="px-6 py-4 text-center">Profit Contrib.</th>
                        <th className="px-6 py-4 text-right">AI Performance Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffProductivity.map(s => (
                        <tr key={s.staffId} className="text-sm hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{s.staffName}</td>
                          <td className="px-6 py-4 text-center text-slate-600 font-medium">{s.orderCount}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-800">{fmtINR(s.totalRevenue)}</td>
                          <td className="px-6 py-4 text-center text-slate-600 font-medium">₹{s.avgOrderValue.toFixed(0)}</td>
                          <td className="px-6 py-4 text-center font-bold text-emerald-600">{fmtINR(s.profitGenerated)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${
                                  s.efficiencyScore > 80 ? 'bg-emerald-500' : s.efficiencyScore > 50 ? 'bg-blue-500' : 'bg-amber-500'
                                }`} style={{ width: `${s.efficiencyScore}%` }} />
                              </div>
                              <span className="font-black text-slate-800 w-8">{s.efficiencyScore}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
