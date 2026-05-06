import { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import { customerApi } from "../../services/api";
import EmptyState from "../../components/ui/EmptyState";

interface Transaction {
  id: string;
  type: "SALE" | "PAYMENT" | "RETURN" | "ADJUSTMENT" | "UDHAR";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  notes?: string;
  createdAt: string;
}

export default function LedgerTimeline({ customerId }: { customerId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [customerId]);

  async function loadTransactions() {
    try {
      setLoading(true);
      const data = await customerApi.getTransactions(customerId);
      setTransactions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (!loading && transactions.length === 0) {
    return (
      <EmptyState 
        icon="📖"
        title="No History Yet"
        description="This customer has no recorded transactions. Add their first Udhar or Payment to start the Khata book."
        className="bg-transparent border-none shadow-none p-4"
      />
    );
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {transactions.map((tx, idx) => (
        <div key={tx.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Dot */}
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-all ${
            tx.type === "PAYMENT" ? "bg-emerald-500 text-white" : 
            tx.type === "UDHAR" || tx.type === "SALE" ? "bg-rose-500 text-white" : "bg-slate-400 text-white"
          }`}>
             {tx.type === "PAYMENT" ? "↓" : "↑"}
          </div>
          
          {/* Content */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between space-x-2 mb-1">
              <div className="font-black text-slate-800 text-sm">
                {tx.type === "PAYMENT" ? "Payment Received" : tx.type === "UDHAR" ? "New Udhar Entry" : "Credit Sale"}
              </div>
              <time className="font-bold text-[10px] text-slate-400 uppercase">{new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time>
            </div>
            <div className="flex items-end justify-between mt-2">
               <div>
                  <p className={`text-lg font-black ${tx.type === "PAYMENT" ? "text-emerald-600" : "text-rose-600"}`}>
                    ₹{tx.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium italic mt-1">{tx.notes}</p>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Running Balance</p>
                  <p className="text-sm font-black text-slate-800">₹{tx.balanceAfter.toLocaleString()}</p>
               </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
