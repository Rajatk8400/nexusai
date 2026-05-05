import { useState, useEffect } from "react";
import { customerApi } from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { exportToExcel } from "../../utils/exportToExcel";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;
  totalCredit: number;
  totalDebit: number;
  updatedAt: string;
}

interface Transaction {
  id: string;
  type: "SALE" | "PAYMENT" | "RETURN" | "ADJUSTMENT";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  notes?: string;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [processing, setProcessing] = useState(false);

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

  async function handleViewCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setModalOpen(true);
    try {
      const res = await customerApi.getTransactions(customer.id);
      setTransactions(res);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRecordPayment() {
    if (!selectedCustomer || !paymentAmount) return;
    setProcessing(true);
    try {
      await customerApi.recordTransaction(selectedCustomer.id, {
        type: "PAYMENT",
        amount: parseFloat(paymentAmount),
        notes: paymentNotes,
        paymentMethod: "CASH"
      });
      alert("Payment recorded successfully");
      setPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentNotes("");
      loadCustomers();
      // Refresh transactions
      const res = await customerApi.getTransactions(selectedCustomer.id);
      setTransactions(res);
    } catch (e) {
      alert("Error recording payment");
    } finally {
      setProcessing(false);
    }
  }

  const handleExport = () => {
    const exportData = customers.map(c => ({
      ID: c.id,
      Name: c.name,
      Phone: c.phone || "",
      Email: c.email || "",
      Balance: c.balance,
      TotalCredit: c.totalCredit,
      TotalDebit: c.totalDebit,
      LastActivity: new Date(c.updatedAt).toLocaleDateString()
    }));
    exportToExcel(exportData, "Customers_Export");
  };

  const totalOutstanding = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Customer Khata</h1>
          <p className="text-slate-500 text-sm">Manage credit and payments for your regular customers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleExport} className="shadow-sm border-slate-200">
            Export Excel
          </Button>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Outstanding</span>
            <span className="text-lg font-black text-red-600">₹{totalOutstanding.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all pl-10"
          />
          <svg className="absolute left-3 top-3.5 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-bold">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-bold bg-white rounded-2xl border border-dashed border-slate-200">No customers found. Start a credit sale to add one.</div>
        ) : customers.map(customer => (
          <Card key={customer.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer group border-l-4 border-l-transparent hover:border-l-blue-500" onClick={() => handleViewCustomer(customer)}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Balance</span>
                <span className={`text-xl font-black ${customer.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  ₹{Math.abs(customer.balance).toLocaleString("en-IN")}
                  <span className="text-[10px] ml-1 font-bold">{customer.balance > 0 ? "Dr" : customer.balance < 0 ? "Cr" : ""}</span>
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-lg leading-tight">{customer.name}</h3>
              <p className="text-slate-500 text-sm font-medium">{customer.phone || "No phone"}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Activity: {new Date(customer.updatedAt).toLocaleDateString()}</span>
              <span className="text-blue-600 text-xs font-bold group-hover:underline">View Ledger →</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Customer Ledger Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedCustomer?.name || "Customer Ledger"}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Sales</span>
                <span className="text-xl font-black text-slate-800">₹{selectedCustomer.totalCredit.toLocaleString("en-IN")}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Paid</span>
                <span className="text-xl font-black text-emerald-600">₹{selectedCustomer.totalDebit.toLocaleString("en-IN")}</span>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Net Balance</span>
                <span className={`text-xl font-black ${selectedCustomer.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  ₹{Math.abs(selectedCustomer.balance).toLocaleString("en-IN")} <span className="text-[10px] ml-1 font-bold">{selectedCustomer.balance > 0 ? "Dr" : selectedCustomer.balance < 0 ? "Cr" : ""}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Recent Transactions</h3>
              <Button variant="primary" size="sm" onClick={() => setPaymentModalOpen(true)}>Record Payment</Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">{new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === "SALE" ? "bg-red-50 text-red-600" : 
                          tx.type === "PAYMENT" ? "bg-emerald-50 text-emerald-600" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-black ${tx.type === "SALE" ? "text-slate-800" : "text-emerald-600"}`}>
                        ₹{tx.amount.toLocaleString("en-IN")} <span className="text-[10px] font-bold text-slate-400 ml-0.5">{tx.type === "SALE" ? "Dr" : "Cr"}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        ₹{Math.abs(tx.balanceAfter).toLocaleString("en-IN")} <span className="text-[10px] font-bold text-slate-400 ml-0.5">{tx.balanceAfter > 0 ? "Dr" : tx.balanceAfter < 0 ? "Cr" : ""}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs italic">{tx.notes || "-"}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">No transactions yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Payment"
        size="sm"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Received (₹)</label>
            <input 
              type="number" 
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-xl text-emerald-600 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</label>
            <textarea 
              placeholder="e.g. Received by Cash / GPay"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 outline-none focus:border-blue-500 transition-all h-24"
            />
          </div>
          <div className="pt-2">
            <Button variant="primary" fullWidth disabled={processing || !paymentAmount} onClick={handleRecordPayment}>
              {processing ? "Recording..." : "Confirm Payment"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
