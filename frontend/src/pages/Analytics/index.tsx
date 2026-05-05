import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { dashboardApi, type RevenueChartPoint } from "../../services/dashboard.service";
import { saleApi } from "../../services/api";
import { type Sale } from "../../services/api";
import { inventoryApi } from "../../services/inventory.service";
import Card from "../../components/ui/Card";
import CustomTooltip from "../../components/charts/CustomTooltip";

function fmtINR(n: number): string {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr";
  if (n >= 100000)   return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000)     return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + n.toFixed(0);
}
function fmtPct(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

const COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4"];

function Sk({ className = "" }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className}`} />;
}

function KpiCard({ label, value, sub, delta, deltaPositive, color, icon }: {
  label: string; value: string; sub?: string;
  delta?: string; deltaPositive?: boolean;
  color: string; icon: string;
}) {
  const borders: Record<string,string> = {
    blue:"border-t-blue-500", emerald:"border-t-emerald-500",
    amber:"border-t-amber-400", violet:"border-t-violet-500",
    red:"border-t-red-400", cyan:"border-t-cyan-400",
  };
  return (
    <Card className={`p-5 border-t-2 ${borders[color] ?? "border-t-blue-500"}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          {delta && (
            <span className={`inline-flex items-center gap-1 text-xs font-bold mt-1.5 px-2 py-0.5 rounded-full ${
              deltaPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
            }`}>
              {deltaPositive ? "↑" : "↓"} {delta}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

type Period = "7" | "30" | "90" | "180";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<RevenueChartPoint[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [topProducts, setTopProducts] = useState<{ name: string; revenue: number; qty: number }[]>([]);
  const [paymentMix, setPaymentMix] = useState<{ name: string; value: number }[]>([]);
  const [stockValue, setStockValue] = useState(0);
  const [retailValue, setRetailValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => { loadAll(); }, [period]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const months = period === "7" ? 1 : period === "30" ? 3 : period === "90" ? 6 : 12;
      const [chart, sales, invReport] = await Promise.all([
        dashboardApi.getRevenueChart(months),
        saleApi.list({ limit: 200 }),
        inventoryApi.stockValueReport(),
      ]);

      const pts = chart ?? [];
      setChartData(pts);
      const rev  = pts.reduce((s: number, p: RevenueChartPoint) => s + p.revenue, 0);
      const prof = pts.reduce((s: number, p: RevenueChartPoint) => s + p.profit, 0);
      const tax  = pts.reduce((s: number, p: RevenueChartPoint) => s + p.tax, 0);
      const ords = pts.reduce((s: number, p: RevenueChartPoint) => s + p.orders, 0);
      setTotalRevenue(rev);
      setTotalProfit(prof);
      setTotalTax(tax);
      setTotalOrders(ords);
      setAvgOrderValue(ords > 0 ? rev / ords : 0);

      const salesList = (sales.items ?? []) as Sale[];
      setRecentSales(salesList.slice(0, 10));

      const prodMap: Record<string, { name: string; revenue: number; qty: number }> = {};
      salesList.forEach((s) => {
        s.items?.forEach((item: any) => {
          const name = item.productName ?? "Unknown";
          if (!prodMap[name]) prodMap[name] = { name, revenue: 0, qty: 0 };
          prodMap[name]!.revenue += Number(item.totalAmount);
          prodMap[name]!.qty += Number(item.quantity);
        });
      });
      setTopProducts(Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6));

      const payMap: Record<string, number> = {};
      salesList.forEach((s) => {
        const m = s.paymentMethod ?? "Credit";
        payMap[m] = (payMap[m] ?? 0) + 1;
      });
      setPaymentMix(Object.entries(payMap).map(([name, value]) => ({ name, value })));

      const inv = (invReport as any)?.summary;
      setStockValue(inv?.totalCostValue ?? 0);
      setRetailValue(inv?.totalRetailValue ?? 0);
      setLowStockCount((invReport as any)?.rows?.filter((r: any) => r.quantityOnHand <= 5).length ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const marginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const dailyData = (() => {
    const map: Record<string, { date: string; revenue: number; orders: number }> = {};
    recentSales.forEach((s) => {
      const d = new Date(s.saleDateAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (!map[d]) map[d] = { date: d, revenue: 0, orders: 0 };
      map[d]!.revenue += Number(s.totalAmount);
      map[d]!.orders += 1;
    });
    return Object.values(map).slice(-14);
  })();

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Analytics</h2>
          <p className="text-slate-400 text-sm mt-0.5">Business performance overview</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1">
          {(["7","30","90","180"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === p ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {p === "7" ? "7D" : p === "30" ? "1M" : p === "90" ? "3M" : "6M"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm flex items-center gap-2">
          ⚠️ {error}
          <button onClick={loadAll} className="ml-auto text-xs font-bold underline">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Sk key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Total Revenue" value={fmtINR(totalRevenue)}
            sub={`${totalOrders} orders`}
            delta={`${fmtINR(avgOrderValue)} avg`} deltaPositive={true}
            color="blue" icon="💰" />
          <KpiCard label="Gross Profit" value={fmtINR(totalProfit)}
            sub={`${marginPct.toFixed(1)}% margin`}
            delta={fmtPct(marginPct)} deltaPositive={marginPct >= 0}
            color={marginPct >= 20 ? "emerald" : marginPct >= 0 ? "amber" : "red"} icon="📈" />
          <KpiCard label="GST Collected" value={fmtINR(totalTax)}
            sub="Total tax liability" color="violet" icon="🧾" />
          <KpiCard label="Stock Value" value={fmtINR(stockValue)}
            sub={`Retail: ${fmtINR(retailValue)}`}
            delta={lowStockCount > 0 ? `${lowStockCount} low stock` : "All stocked"}
            deltaPositive={lowStockCount === 0}
            color={lowStockCount > 0 ? "amber" : "cyan"} icon="📦" />
        </div>
      )}

      {/* Revenue & Profit Chart */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-black text-slate-800 text-base">Revenue vs Profit Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">Monthly breakdown</p>
        </div>
        {loading ? <Sk className="h-64" /> : chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <span className="text-4xl mb-3">📊</span>
            <p className="font-semibold">No sales data yet</p>
            <p className="text-sm mt-1">Create some sales invoices to see trends here</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={fmtINR} />
                <Tooltip content={<CustomTooltip formatter={fmtINR} />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                <Area type="monotone" dataKey="expenses" name="COGS" stroke="#f59e0b" strokeWidth={1.5} fill="url(#gC)" dot={false} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} fill="url(#gP)" dot={false} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gR)"
                  dot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* 2-col: Top Products + Payment Mix */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-black text-slate-800 text-base">Top Products by Revenue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Based on completed sales</p>
          </div>
          {loading ? <Sk className="h-48" /> : topProducts.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No product sales yet</div>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={fmtINR} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={85}
                      tickFormatter={(v) => v.length > 11 ? v.slice(0, 11) + "…" : v} />
                    <Tooltip content={<CustomTooltip formatter={fmtINR} />} />
                    <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]}>
                      {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                {topProducts.slice(0, 4).map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</div>
                    <p className="flex-1 text-sm text-slate-700 font-medium truncate">{p.name}</p>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{fmtINR(p.revenue)}</p>
                      <p className="text-xs text-slate-400">{p.qty} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="font-black text-slate-800 text-base">Payment Methods</h3>
              <p className="text-xs text-slate-400 mt-0.5">How customers pay</p>
            </div>
            {loading ? <Sk className="h-36" /> : paymentMix.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-slate-400 text-sm">No payment data yet</div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-32 w-32 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentMix} cx="50%" cy="50%" innerRadius={30} outerRadius={52} paddingAngle={3} dataKey="value">
                        {paymentMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl">
                            <p className="font-bold">{payload[0]!.name}</p>
                            <p>{payload[0]!.value} orders</p>
                          </div>
                        ) : null} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {paymentMix.map((p, i) => {
                    const total = paymentMix.reduce((s, x) => s + x.value, 0);
                    const pct = total > 0 ? ((p.value / total) * 100).toFixed(0) : "0";
                    return (
                      <div key={p.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            {p.name}
                          </span>
                          <span className="font-bold text-slate-700">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <h3 className="font-black text-slate-800 text-base">Daily Sales Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Recent order trend</p>
            </div>
            {loading ? <Sk className="h-28" /> : dailyData.length === 0 ? (
              <div className="h-28 flex items-center justify-center text-slate-400 text-sm">No daily data yet</div>
            ) : (
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                      interval={Math.floor(dailyData.length / 4)} />
                    <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={fmtINR} />
                    <Tooltip content={<CustomTooltip formatter={fmtINR} />} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" strokeWidth={2}
                      dot={{ r: 3, fill: "#8b5cf6" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Orders bar chart */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-black text-slate-800 text-base">Monthly Order Volume</h3>
          <p className="text-xs text-slate-400 mt-0.5">Number of invoices per month</p>
        </div>
        {loading ? <Sk className="h-48" /> : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="bG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={(v) => `${v} orders`} />} />
                <Bar dataKey="orders" name="Orders" fill="url(#bG)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Recent Sales Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-sm">Recent Transactions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest {recentSales.length} invoices</p>
          </div>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Sk key={i} className="h-10" />)}</div>
        ) : recentSales.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl">🧾</span>
            <p className="text-slate-500 font-semibold mt-3">No sales yet</p>
            <p className="text-slate-400 text-sm mt-1">Go to Sales and create your first invoice</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Invoice #","Customer","Items","Total","Tax","Profit","Payment","Date"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentSales.map((sale) => {
                  const meta = sale.metadata;
                  const profit = meta?.grossProfit ?? 0;
                  const marginP = meta?.grossMarginPct ?? 0;
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-blue-600 font-mono text-xs font-semibold">{sale.invoiceNumber}</span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-700">{sale.customerName ?? "Walk-in"}</p>
                        {sale.customerPhone && <p className="text-xs text-slate-400">{sale.customerPhone}</p>}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{sale.items?.length ?? "—"}</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{fmtINR(Number(sale.totalAmount))}</td>
                      <td className="px-5 py-3 text-slate-500">{fmtINR(Number(sale.taxAmount))}</td>
                      <td className="px-5 py-3">
                        {meta ? (
                          <span className={`font-semibold text-xs ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {fmtINR(profit)}
                            <span className="text-slate-400 font-normal ml-1">({marginP.toFixed(1)}%)</span>
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                          sale.paymentStatus === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"
                        }`}>
                          {sale.paymentMethod ?? "Credit"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(sale.saleDateAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 grid grid-cols-4 gap-4">
              {[
                { label: "Total Revenue", value: fmtINR(recentSales.reduce((s, x) => s + Number(x.totalAmount), 0)), color: "text-blue-600" },
                { label: "Total Tax", value: fmtINR(recentSales.reduce((s, x) => s + Number(x.taxAmount), 0)), color: "text-violet-600" },
                { label: "Total Profit", value: fmtINR(recentSales.reduce((s, x) => s + (x.metadata?.grossProfit ?? 0), 0)), color: "text-emerald-600" },
                { label: "Invoices", value: String(recentSales.length), color: "text-slate-700" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={`text-base font-black mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}