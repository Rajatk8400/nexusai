import { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { PlusIcon } from "../../components/ui/Icons";
import { expenseApi } from "../../services/api";
import EmptyState from "../../components/ui/EmptyState";

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (!loading && expenses.length === 0) {
    return (
      <EmptyState 
        icon="📉"
        title="No Expenses Tracked"
        description="Add your business expenses like rent, salaries, or fuel to calculate your real net profit."
        actionLabel="Add Expense"
        onAction={() => {}}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
           <div>
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Business Expenses</h3>
             <p className="text-xs text-slate-400 mt-0.5">Track and categorize all overheads</p>
           </div>
           <Button variant="primary" size="sm" className="flex items-center gap-2">
             <PlusIcon size={14} /> Add Expense
           </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((row, idx) => (
                <tr key={idx} className="text-sm hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                      {row.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{row.description}</td>
                  <td className="px-6 py-4 font-black text-slate-800">₹{row.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-bold uppercase">{row.paymentMethod}</td>
                  <td className="px-6 py-4 text-right text-xs text-slate-400 font-medium">{new Date(row.dateAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
