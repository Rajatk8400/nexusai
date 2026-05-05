import { useState, useEffect } from "react";
import { expenseApi } from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

const CATEGORIES = ["RENT", "SALARY", "ELECTRICITY", "MARKETING", "MAINTENANCE", "OTHER"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "OTHER",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      setLoading(true);
      const res = await expenseApi.list();
      setExpenses(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!formData.amount) return;
    setSaving(true);
    try {
      await expenseApi.create({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setModalOpen(false);
      setFormData({
        category: "OTHER",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0]
      });
      loadExpenses();
    } catch (e) {
      alert("Error saving expense");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await expenseApi.delete(id);
      loadExpenses();
    } catch (e) {
      alert("Error deleting expense");
    }
  }

  const totalThisMonth = expenses.reduce((acc, ex) => acc + ex.amount, 0);

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Expense Tracker</h1>
          <p className="text-slate-500 text-sm">Monitor your daily business costs and overheads</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-end">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Expenses</span>
             <span className="text-lg font-black text-red-600">₹{totalThisMonth.toLocaleString("en-IN")}</span>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>Add Expense</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold">Loading expenses...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold">No expenses found. Add your first cost to start tracking.</td></tr>
              ) : expenses.map(ex => (
                <tr key={ex.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(ex.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded">
                      {ex.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{ex.description || "-"}</td>
                  <td className="px-6 py-4 text-right font-black text-red-600">₹{ex.amount.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleDelete(ex.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Expense"
        size="md"
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
              <input 
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-800 outline-none focus:border-blue-500 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
            <input 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 outline-none focus:border-blue-500 transition-all h-24"
              placeholder="e.g. Shop Rent for Oct"
            />
          </div>
          <div className="pt-4">
            <Button variant="primary" fullWidth disabled={saving || !formData.amount} onClick={handleSubmit}>
              {saving ? "Saving..." : "Record Expense"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
