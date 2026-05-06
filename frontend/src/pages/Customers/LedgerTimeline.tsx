import Card from "../../components/ui/Card";

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
  // Mock data for demonstration
  const transactions: Transaction[] = [
    { id: "1", type: "PAYMENT", amount: 5000, balanceBefore: 8000, balanceAfter: 3000, notes: "Received via GPay", createdAt: "2024-05-01T10:00:00Z" },
    { id: "2", type: "UDHAR", amount: 4500, balanceBefore: 3500, balanceAfter: 8000, notes: "Grocery items + Milk", createdAt: "2024-04-28T14:30:00Z" },
    { id: "3", type: "SALE", amount: 1500, balanceBefore: 2000, balanceAfter: 3500, notes: "Invoice #1024", createdAt: "2024-04-25T11:15:00Z" },
    { id: "4", type: "PAYMENT", amount: 10000, balanceBefore: 12000, balanceAfter: 2000, notes: "Cash payment", createdAt: "2024-04-20T09:00:00Z" },
    { id: "5", type: "UDHAR", amount: 12000, balanceBefore: 0, balanceAfter: 12000, notes: "Opening balance / Credit limit sync", createdAt: "2024-04-15T16:00:00Z" },
  ];

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
