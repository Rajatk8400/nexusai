import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { dashboardApi, inventoryApi } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────
function fINR(n: number): string {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(0) + "K";
  return "₹" + (n ?? 0).toFixed(0);
}

// ── Simple UI components (no external imports needed) ─────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color, sparkData }: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  sparkData?: { value: number }[];
}) {
  const borders: Record<string, string> = {
    blue: "border-t-blue-500",
    emerald: "border-t-emerald-500",
    amber: "border-t-amber-400",
    violet: "border-t-violet-500",
    red: "border-t-red-400",
  };
  const strokes: Record<string, string> = {
    blue: "#3b82f6", emerald: "#10b981",
    amber: "#f59e0b", violet: "#8b5cf6", red: "#ef4444",
  };
  const stroke = strokes[color] ?? "#3b82f6";

  return (
    <Card className={`p-5 border-t-2 ${borders[color] ?? "border-t-blue-500"}`}>
      <p className="text-sm font-medium text-slate-500 mb-3">{label}</p>
      <p className="text-3xl font-black text-slate-800 tracking-tight mb-1">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
      {sparkData && sparkData.length > 1 && (
        <div className="mt-3 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`sg${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={stroke} strokeWidth={2}
                fill={`url(#sg${color})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'OWNER';
  const navigate = useNavigate();

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => dashboardApi.overview()
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryApi.getLowStock()
  });

  const kpis = overview?.kpis ?? overview;
  const chart = overview?.revenueChart ?? [];
  const lowStock = (alerts ?? []).slice(0, 5);

  const loading = overviewLoading || alertsLoading;
  const error = overviewError ? (overviewError as Error).message : null;

  if (error) {
    toast.error(error, { id: 'dashboard-error' });
  }

  const channelData = overview?.paymentMix || [];

  if (loading) return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-36 bg-white rounded-xl border border-slate-200 animate-pulse" />
      ))}
    </div>
  );

  if (error) return (
    <div className="p-6 flex items-center justify-center min-h-96">
      <div className="text-center">
        <p className="text-red-500 font-semibold mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            Good morning, {user?.firstName}! 👋
          </h2>
          <p className="text-slate-400 text-sm">Here's what's happening today</p>
        </div>
        <button
          onClick={() => navigate("/sales")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + New Sale
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Revenue"
          value={fINR(kpis?.monthRevenue ?? 0)}
          sub={`${kpis?.monthOrders ?? 0} orders this month`}
          color="blue"
          sparkData={chart.map((d: any) => ({ value: d.revenue ?? 0 }))}
        />
        {isAdminOrManager ? (
          <>
            <StatCard
              label="Monthly Profit"
              value={fINR(kpis?.monthProfit ?? 0)}
              sub={`Margin: ${kpis?.profitMargin ?? 0}%`}
              color="emerald"
              sparkData={chart.map((d: any) => ({ value: d.profit ?? 0 }))}
            />
            <StatCard
              label="Net Profit"
              value={fINR(kpis?.netProfit ?? 0)}
              sub={`After ₹${(kpis?.monthExpenses ?? 0).toLocaleString()} expenses`}
              color={kpis?.netProfit >= 0 ? "emerald" : "red"}
            />
            <StatCard
              label="Monthly Expenses"
              value={fINR(kpis?.monthExpenses ?? 0)}
              sub="Total business overheads"
              color="amber"
            />
          </>
        ) : (
          <StatCard
            label="Total Orders"
            value={(kpis?.monthOrders ?? 0).toString()}
            sub="Orders this month"
            color="emerald"
          />
        )}
        <StatCard
          label="Stock Value (MRP)"
          value={fINR(kpis?.stockValue?.totalMrpValue ?? 0)}
          sub="Current inventory worth"
          color="violet"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="xl:col-span-2 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">{isAdminOrManager ? "Revenue vs Profit" : "Monthly Revenue"}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 7 months</p>
            </div>
            <div className="flex items-center gap-4">
              {[
                { color: "#3b82f6", label: "Revenue" },
                ...(isAdminOrManager ? [{ color: "#10b981", label: "Profit" }] : []),
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-3 h-1.5 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <div className="h-56">
            {chart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No sales data yet. Create your first sale!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => "₹" + (v / 1000) + "K"} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}
                    formatter={(v: number) => ["₹" + (v / 1000).toFixed(1) + "K"]}
                  />
                  {isAdminOrManager && (
                    <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2}
                      fill="url(#gradP)" dot={false} name="Profit" />
                  )}
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5}
                    fill="url(#gradR)" dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                    name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Payment Mix */}
        <Card className="p-5">
          <h2 className="font-bold text-slate-800 text-sm mb-1">Payment Mix</h2>
          <p className="text-xs text-slate-400 mb-4">This month</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {channelData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none" }}
                  formatter={(v: number) => [`${v}%`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {channelData.map((ch: any) => (
              <div key={ch.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: ch.color }} />
                  {ch.name}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: ch.value + "%", background: ch.color }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-8 text-right">{ch.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">⚠️ Low Stock Alerts</h2>
              <p className="text-xs text-slate-400 mt-0.5">{lowStock.length} products need restocking</p>
            </div>
            <button
              onClick={() => navigate("/inventory")}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50"
            >
              View Inventory
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Product", "SKU", "In Stock", "Reorder Point", "Status"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lowStock.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-semibold text-slate-700">{a.name}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{a.sku}</span>
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-red-600">{a.quantityOnHand}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{a.reorderPoint ?? 5}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.quantityOnHand <= 0
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {a.quantityOnHand <= 0 ? "Out of Stock" : "Low Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty state when no data */}
      {chart.length === 0 && lowStock.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-4xl mb-4">🚀</p>
          <h3 className="font-bold text-slate-800 mb-2">Ready to go!</h3>
          <p className="text-slate-500 text-sm mb-6">Add products and create your first sale to see dashboard data</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate("/products")}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              Add Products
            </button>
            <button
              onClick={() => navigate("/sales")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Create First Sale
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}