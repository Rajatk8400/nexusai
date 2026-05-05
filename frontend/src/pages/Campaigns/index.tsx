import { useState, useEffect } from "react";
import { campaignApi } from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

export default function CampaignsPage() {
  const [stats, setStats] = useState<any>(null);
  const [template, setTemplate] = useState("Hello {name}, we have a special offer for you! Your current balance is ₹{balance}. Visit us today!");
  const [segment, setSegment] = useState<"ALL" | "DUE">("ALL");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await campaignApi.getStats();
      setStats(res);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSend() {
    setLoading(true);
    try {
      const res = await campaignApi.send({ template, segment, channel: "WHATSAPP" });
      setResults(res.results);
      setModalOpen(true);
    } catch (e) {
      alert("Error starting campaign");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Campaign Studio</h1>
        <p className="text-slate-500 text-sm">Create and blast WhatsApp marketing campaigns to your customers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">1. Select Audience</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setSegment("ALL")}
                className={`p-4 border-2 rounded-xl text-left transition-all ${segment === "ALL" ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-slate-200"}`}
              >
                <p className="font-bold text-slate-800">All Customers</p>
                <p className="text-xs text-slate-500">{stats?.totalCustomers || 0} contacts</p>
              </button>
              <button 
                onClick={() => setSegment("DUE")}
                className={`p-4 border-2 rounded-xl text-left transition-all ${segment === "DUE" ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-slate-200"}`}
              >
                <p className="font-bold text-slate-800">Payment Dues</p>
                <p className="text-xs text-slate-500">{stats?.customersWithBalance || 0} contacts</p>
              </button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">2. Compose Message</h3>
            <div className="space-y-3">
              <textarea 
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 outline-none focus:border-blue-500 transition-all text-sm"
                placeholder="Write your message here..."
              />
              <div className="flex flex-wrap gap-2">
                {["{name}", "{balance}"].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setTemplate(prev => prev + tag)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-600 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic">Personalize your message using the tags above.</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 text-white border-0 h-full flex flex-col">
            <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-6">Campaign Preview</h3>
            <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-white">W</div>
                  <div>
                    <p className="font-bold text-sm">WhatsApp Business</p>
                    <p className="text-[10px] text-emerald-400 font-bold">Encrypted</p>
                  </div>
               </div>
               <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 text-sm text-slate-200 leading-relaxed shadow-lg">
                 {template.replace(/{name}/g, "Rajesh").replace(/{balance}/g, "1,500")}
               </div>
               <div className="absolute bottom-4 right-4 text-[10px] text-slate-500">12:45 PM</div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
               <Button variant="primary" fullWidth size="lg" className="bg-emerald-500 hover:bg-emerald-600 border-0 py-4 shadow-xl shadow-emerald-500/20" onClick={handleSend} disabled={loading}>
                 {loading ? "Initializing..." : "Launch WhatsApp Campaign"}
               </Button>
               <p className="text-[10px] text-center text-slate-500 mt-4">Campaign will generate 1-click links for manual blast or automated API sending.</p>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Campaign Results"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl">✓</div>
             <div>
                <h4 className="font-black text-emerald-800 uppercase tracking-tight">Campaign Ready!</h4>
                <p className="text-emerald-600 text-sm font-medium">Generated {results.length} personalized messages for your customers.</p>
             </div>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((res, i) => (
                  <tr key={i} className="text-sm">
                    <td className="px-4 py-4">
                       <p className="font-bold text-slate-800">{res.customerName}</p>
                       <p className="text-xs text-slate-400 font-medium">{res.phone}</p>
                    </td>
                    <td className="px-4 py-4">
                       <a 
                        href={res.link} 
                        target="_blank" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
                       >
                         Send on WhatsApp
                       </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pt-2">
            <Button variant="secondary" fullWidth onClick={() => setModalOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
