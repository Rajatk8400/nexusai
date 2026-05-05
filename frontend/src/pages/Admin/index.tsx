import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [s, b] = await Promise.all([
        adminApi.getStats(),
        adminApi.getBusinesses()
      ]);
      setStats(s);
      setBusinesses(b);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this upgrade?")) return;
    try {
      await adminApi.approve(id);
      alert("Upgrade approved!");
      fetchData();
    } catch (e) {
      alert("Failed to approve upgrade");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading admin data...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">NexusAI Admin</h1>
          <p className="text-slate-500 text-sm">Managing the ecosystem and verifying payments</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="info">SUPER_ADMIN Access</Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats?.totalBusinesses, color: "bg-blue-50 text-blue-600" },
          { label: "Active Plans", value: stats?.activePlans, color: "bg-emerald-50 text-emerald-600" },
          { label: "Pending", value: stats?.pendingUpgrades, color: "bg-amber-50 text-amber-600", pulse: true },
          { label: "Trial Users", value: stats?.trialPlans, color: "bg-slate-50 text-slate-600" },
        ].map((s, i) => (
          <Card key={i} className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color.split(" ")[1]} ${s.pulse ? "animate-pulse" : ""}`}>
              {s.value ?? 0}
            </p>
          </Card>
        ))}
      </div>

      {/* Businesses Table */}
      <Card className="overflow-hidden border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Business Management</h3>
          <span className="text-xs text-slate-400 font-medium">{businesses.length} total users</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-3">Business / ID</th>
                <th className="px-6 py-3">Current Plan</th>
                <th className="px-6 py-3">Payment Info</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-700 text-sm">{b.name}</p>
                    <p className="text-[10px] font-mono text-slate-400">{b.shortId || "NO-ID"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-slate-600">{b.plan}</p>
                    {b.planExpiresAt && (
                      <p className="text-[10px] text-slate-400">Exp: {new Date(b.planExpiresAt).toLocaleDateString()}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {b.lastTransactionId ? (
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-blue-600 uppercase">UTR Number</p>
                        <p className="text-xs font-mono text-slate-500">{b.lastTransactionId}</p>
                        {b.pendingPlanId && <Badge variant="info" className="text-[8px]">{b.pendingPlanId}</Badge>}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">No payment info</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={
                        b.planStatus === "ACTIVE" ? "success" :
                        b.planStatus === "PENDING_UPGRADE" ? "warning" :
                        b.planStatus === "EXPIRED" ? "danger" : "default"
                      }
                    >
                      {b.planStatus}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {b.planStatus === "PENDING_UPGRADE" && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                        onClick={() => handleApprove(b.id)}
                      >
                        Approve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
