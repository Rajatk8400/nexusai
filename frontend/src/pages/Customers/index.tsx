import { useState, useEffect } from "react";
import { customerApi } from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { PlusIcon, SparkleIcon, DownloadIcon } from "../../components/ui/Icons";
import KhataDashboard from "./KhataDashboard";
import QuickEntryModal from "./QuickEntryModal";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;
  totalCredit: number;
  totalDebit: number;
  riskStatus: "CLEAR" | "PENDING" | "OVERDUE" | "HIGH_RISK";
  creditLimit: number;
  updatedAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  async function loadCustomers() {
    try {
      setLoading(true);
      const res = await customerApi.list({ search });
      setCustomers(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const totalOutstanding = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
  const overdueCount = customers.filter(c => c.riskStatus === "OVERDUE" || c.riskStatus === "HIGH_RISK").length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto min-h-screen relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            AI Smart Khata Book
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase rounded-full">Active</span>
          </h1>
          <p className="text-slate-500 text-sm">Real-time udhar tracking & AI-powered collections</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                 <SparkleIcon size={16} />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">High Risk Recovery</span>
                 <span className="text-sm font-black text-rose-600">₹{(totalOutstanding * 0.15).toLocaleString()}</span>
              </div>
           </div>
           <div className="bg-slate-900 px-5 py-2.5 rounded-xl text-white shadow-xl shadow-slate-200 flex flex-col items-end">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Outstanding</span>
             <span className="text-xl font-black">₹{totalOutstanding.toLocaleString()}</span>
           </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">👥</div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Customers</p>
               <p className="text-lg font-black text-slate-800">{customers.length}</p>
            </div>
         </Card>
         <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">⚠️</div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Overdue Khatas</p>
               <p className="text-lg font-black text-rose-600">{overdueCount}</p>
            </div>
         </Card>
         <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">💰</div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Today's Collection</p>
               <p className="text-lg font-black text-emerald-600">₹12,450</p>
            </div>
         </Card>
         <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">✨</div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">AI Trust Score</p>
               <p className="text-lg font-black text-indigo-600">72 / 100</p>
            </div>
         </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Search by name, phone, or risk status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pl-12"
          />
          <svg className="absolute left-4 top-4.5 text-slate-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <Button variant="secondary" className="h-14 px-6 bg-white border-slate-200"><DownloadIcon size={20} className="mr-2" /> Statement</Button>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
             <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Synchronizing Khata...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full py-24 text-center text-slate-400 font-bold bg-white rounded-3xl border border-dashed border-slate-200">
             <p className="text-lg mb-2">No customers found in your Khata.</p>
             <p className="text-sm font-medium opacity-60">Add a new sale or payment to start a ledger.</p>
          </div>
        ) : customers.map(customer => (
          <Card 
            key={customer.id} 
            className="p-0 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group relative"
            onClick={() => { setSelectedCustomer(customer); setShowDashboard(true); }}
          >
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6 transition-all duration-300">
                   <span className="text-xl font-black uppercase">{customer.name.charAt(0)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Current Balance</span>
                  <p className={`text-xl font-black ${customer.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    ₹{Math.abs(customer.balance).toLocaleString()}
                    <span className="text-[10px] ml-1 font-bold opacity-60">{customer.balance > 0 ? "Dr" : "Cr"}</span>
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{customer.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-slate-400 text-xs font-bold">{customer.phone || "No phone"}</p>
                   <span className="w-1 h-1 bg-slate-200 rounded-full" />
                   <span className={`text-[9px] font-black uppercase tracking-wider ${
                     customer.riskStatus === "HIGH_RISK" ? "text-rose-600" : 
                     customer.riskStatus === "OVERDUE" ? "text-amber-600" : "text-emerald-600"
                   }`}>
                     {customer.riskStatus}
                   </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Limit Utilization</span>
                    <span className="text-[10px] font-bold text-slate-800">{Math.round((customer.balance / (customer.creditLimit || 1)) * 100)}%</span>
                 </div>
                 <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                       customer.balance > (customer.creditLimit * 0.8) ? "bg-rose-500" : "bg-indigo-500"
                    }`} style={{ width: `${Math.min((customer.balance / (customer.creditLimit || 1)) * 100, 100)}%` }} />
                 </div>
              </div>
            </div>
            
            <div className="px-5 py-3 bg-slate-50/50 flex items-center justify-between group-hover:bg-indigo-50 transition-colors">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                 Activity: {new Date(customer.updatedAt).toLocaleDateString()}
               </span>
               <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                 View Ledger <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
               </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowQuickEntry(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
      >
         <PlusIcon size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Modals */}
      <Modal
        open={showDashboard}
        onClose={() => setShowDashboard(false)}
        size="full"
        showClose={false}
        title=""
      >
        {selectedCustomer && (
          <KhataDashboard 
            customer={selectedCustomer} 
            onClose={() => setShowDashboard(false)} 
            onRecordPayment={() => { setShowDashboard(false); setShowQuickEntry(true); }}
          />
        )}
      </Modal>

      <QuickEntryModal 
        open={showQuickEntry} 
        onClose={() => setShowQuickEntry(false)} 
        onSuccess={loadCustomers} 
      />
    </div>
  );
}
