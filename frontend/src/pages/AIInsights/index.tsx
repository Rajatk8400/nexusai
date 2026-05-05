import { useState, useEffect } from "react";
import { aiApi } from "../../services/api";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    try {
      setLoading(true);
      const data = await aiApi.getInventoryInsights();
      setInsights(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const criticalItems = insights.filter(i => i.status === "CRITICAL");
  const warningItems = insights.filter(i => i.status === "WARNING");

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          AI Inventory Insights
          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-full">Beta</span>
        </h1>
        <p className="text-slate-500 text-sm">Predictive stock management based on your sales velocity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 border-l-4 border-l-red-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical Reorders</p>
          <p className="text-3xl font-black text-slate-800">{criticalItems.length}</p>
          <p className="text-xs text-slate-500 mt-1">Stock will finish in &lt; 7 days</p>
        </Card>
        <Card className="p-5 border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Upcoming Reorders</p>
          <p className="text-3xl font-black text-slate-800">{warningItems.length}</p>
          <p className="text-xs text-slate-500 mt-1">Stock will finish in &lt; 15 days</p>
        </Card>
        <Card className="p-5 border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Health Score</p>
          <p className="text-3xl font-black text-slate-800">
            {Math.round(((insights.length - criticalItems.length) / (insights.length || 1)) * 100)}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Inventory availability rating</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Stock Health Report</h3>
           <button onClick={loadInsights} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Refresh Predictions</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Product / SKU</th>
              <th className="px-6 py-4 text-center">Velocity (Unit/Day)</th>
              <th className="px-6 py-4 text-center">Days Remaining</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Recommendation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold">Analysing sales patterns...</td></tr>
            ) : insights.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold">No inventory data available for analysis.</td></tr>
            ) : insights.map(i => (
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
                   ) : i.status === "EXCESS" ? (
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Slow down reorders</span>
                   ) : (
                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Stock is stable</span>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
