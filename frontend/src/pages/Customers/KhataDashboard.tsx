import { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { SparkleIcon, PhoneIcon, MapPinIcon, ShieldCheckIcon } from "../../components/ui/Icons";
import LedgerTimeline from "./LedgerTimeline";
import { customerApi } from "../../services/api";

interface KhataDashboardProps {
  customer: any;
  onClose: () => void;
  onRecordPayment: () => void;
  onAddUdhar: () => void;
}

export default function KhataDashboard({ customer, onClose, onRecordPayment, onAddUdhar }: KhataDashboardProps) {
  const [activeTab, setActiveTab] = useState<"ledger" | "analytics" | "reminders">("ledger");
  const [trustScore, setTrustScore] = useState<any>(null);
  const [loadingScore, setLoadingScore] = useState(true);

  useEffect(() => {
    loadTrustScore();
  }, [customer.id]);

  async function loadTrustScore() {
    try {
      setLoadingScore(true);
      const res = await customerApi.getTrustScore(customer.id);
      setTrustScore(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingScore(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in slide-in-from-right-10 duration-300">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
           </button>
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">
                 {customer.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 leading-tight">{customer.name}</h2>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                   <span className="flex items-center gap-1"><PhoneIcon size={12} /> {customer.phone}</span>
                   <span className="flex items-center gap-1"><MapPinIcon size={12} /> {customer.address || "No Address"}</span>
                </div>
              </div>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" size="sm" onClick={onAddUdhar} className="bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 font-black">Give Udhar</Button>
           <Button variant="primary" size="sm" onClick={onRecordPayment} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 font-black">Got Payment</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="p-5 border-none shadow-sm bg-white">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
              <p className={`text-2xl font-black ${customer.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                ₹{Math.abs(customer.balance).toLocaleString("en-IN")}
                <span className="text-xs ml-1 opacity-50">{customer.balance > 0 ? "Dr" : "Cr"}</span>
              </p>
              <div className="mt-3 flex items-center gap-2">
                 <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                   customer.riskStatus === "HIGH_RISK" ? "bg-red-100 text-red-600" : 
                   customer.riskStatus === "OVERDUE" ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600"
                 }`}>
                   {customer.riskStatus}
                 </span>
              </div>
           </Card>

           <Card className="p-5 border-none shadow-sm bg-white">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credit Limit</p>
              <p className="text-2xl font-black text-slate-800">₹{customer.creditLimit?.toLocaleString("en-IN") || "0"}</p>
              <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((customer.balance / (customer.creditLimit || 1)) * 100, 100)}%` }} />
              </div>
           </Card>

           <Card className={`p-5 border-none shadow-sm relative overflow-hidden transition-all duration-500 ${
             loadingScore ? "bg-slate-800" : 
             (trustScore?.score || 0) > 750 ? "bg-gradient-to-br from-emerald-600 to-teal-700" :
             (trustScore?.score || 0) > 500 ? "bg-gradient-to-br from-indigo-600 to-violet-700" :
             "bg-gradient-to-br from-rose-600 to-red-700"
           } text-white`}>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">AI Trust Score</p>
                <p className="text-2xl font-black">
                  {loadingScore ? "..." : trustScore?.score || "N/A"} 
                  {!loadingScore && trustScore && <span className="text-xs font-bold text-white/60"> / 900</span>}
                </p>
                <div className="mt-3 flex items-center gap-2">
                   <ShieldCheckIcon size={14} className={trustScore?.riskLevel === "LOW" ? "text-emerald-400" : "text-white/60"} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">
                     {loadingScore ? "Calculating..." : trustScore?.riskLevel ? `${trustScore.riskLevel} RISK` : "No History"}
                   </span>
                </div>
              </div>
              <SparkleIcon size={64} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
           </Card>

           <Card className="p-5 border-none shadow-sm bg-white flex flex-col justify-center">
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" fullWidth className="h-10 text-[10px] font-black uppercase">PDF Statement</Button>
                <Button variant="secondary" size="sm" fullWidth className="h-10 text-[10px] font-black uppercase">WhatsApp</Button>
              </div>
           </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Main Ledger Area */}
           <Card className="lg:col-span-2 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                 <div className="flex bg-slate-200/50 p-1 rounded-lg">
                    {["ledger", "analytics", "reminders"].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${
                          activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                 </div>
              </div>
              
              <div className="flex-1 p-6">
                 {activeTab === "ledger" && <LedgerTimeline customerId={customer.id} />}
                 {activeTab === "analytics" && (
                   <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">📊</div>
                      <p className="text-xs font-bold uppercase tracking-widest">Analytics Module Coming Soon</p>
                   </div>
                 )}
                 {activeTab === "reminders" && (
                   <div className="space-y-4">
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                         <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-1">Friendly Reminder Template</h4>
                         <p className="text-sm text-indigo-700 leading-relaxed mb-4">"Hi {customer.name}, just a gentle reminder from NexusAI regarding your pending balance of ₹{customer.balance.toLocaleString()}. Hope you have a great day!"</p>
                         <Button variant="primary" size="sm">Send on WhatsApp</Button>
                      </div>
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                         <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest mb-1">Urgent Overdue Template</h4>
                         <p className="text-sm text-rose-700 leading-relaxed mb-4">"IMPORTANT: Hi {customer.name}, your payment of ₹{customer.balance.toLocaleString()} is now overdue. Please settle this at your earliest convenience."</p>
                         <Button variant="secondary" size="sm" className="bg-white border-rose-200 text-rose-700">Send on SMS</Button>
                      </div>
                   </div>
                 )}
              </div>
           </Card>

           {/* Side AI Panel */}
           <div className="space-y-6">
              <Card className="p-6 bg-slate-900 text-white border-none shadow-xl">
                 <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                   <span className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">✨</span>
                   AI Payment Insights
                 </h3>
                 <div className="space-y-4">
                    {!trustScore || trustScore.insights?.length === 0 ? (
                      <p className="text-xs text-white/40 italic py-4">Waiting for more transaction history to generate payment behavior insights...</p>
                    ) : (
                      trustScore.insights.map((insight: string, i: number) => (
                        <div key={i} className="flex gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-indigo-400 mt-1 text-xs">•</span>
                          <p className="text-xs font-medium leading-relaxed opacity-80">{insight}</p>
                        </div>
                      ))
                    )}
                 </div>
              </Card>

              <Card className="p-6 bg-white border-none shadow-sm">
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Credit Utilization</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <span className="text-xs font-bold text-slate-500">Owed Amount</span>
                       <span className="text-sm font-black text-slate-800">₹{customer.balance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <span className="text-xs font-bold text-slate-500">Available Credit</span>
                       <span className="text-sm font-black text-emerald-600">₹{Math.max((customer.creditLimit || 0) - customer.balance, 0).toLocaleString()}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-50">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Collection Probability</p>
                       <div className="flex justify-center">
                          <div className="w-24 h-24 relative flex items-center justify-center">
                             <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" r="16" cx="18" cy="18" />
                                <circle className={`text-${customer.balance === 0 ? "slate-200" : "emerald-500"}`} strokeWidth="3" strokeDasharray={`${customer.balance === 0 ? 0 : 92}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" r="16" cx="18" cy="18" />
                             </svg>
                             <span className="absolute text-xl font-black text-slate-800">
                               {customer.balance === 0 ? "N/A" : trustScore?.riskLevel === "LOW" ? "92%" : trustScore?.riskLevel === "MEDIUM" ? "75%" : "40%"}
                             </span>
                          </div>
                       </div>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
}
