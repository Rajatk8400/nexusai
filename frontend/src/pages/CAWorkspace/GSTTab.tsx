import { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { DownloadIcon, ShieldCheckIcon } from "../../components/ui/Icons";
import { reportApi } from "../../services/api";
import EmptyState from "../../components/ui/EmptyState";

export default function GSTTab() {
  const [gstData, setGstData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGstData();
  }, []);

  async function loadGstData() {
    try {
      setLoading(true);
      const now = new Date();
      const res = await reportApi.getGSTR1({ month: now.getMonth() + 1, year: now.getFullYear() });
      setGstData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (!loading && (!gstData || gstData.totalInvoices === 0)) {
    return (
      <EmptyState 
        icon="🏦"
        title="GST Reports Not Ready"
        description="Your GST compliance reports (GSTR-1, GSTR-3B) will be automatically generated once you start recording sales and purchases."
        actionLabel="Go to Sales"
        onAction={() => {}}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-900 text-white border-none shadow-xl">
           <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">GST Payable (B2B + B2C)</p>
           <h2 className="text-3xl font-black mb-4">₹{(gstData?.totalTax || 0).toLocaleString()}</h2>
           <div className="flex gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">Ready to File</span>
           </div>
        </Card>

        <Card className="p-6 bg-indigo-600 text-white border-none shadow-xl">
           <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">ITC Claimable (Purchases)</p>
           <h2 className="text-3xl font-black mb-4">₹{(gstData?.totalITC || 0).toLocaleString()}</h2>
           <Button variant="secondary" size="sm" fullWidth className="bg-white/10 border-white/20 text-white hover:bg-white/20">Verify Bills</Button>
        </Card>

        <Card className="p-6">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Compliance Status</p>
           <div className="flex items-center gap-3 mt-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <ShieldCheckIcon size={24} />
              </div>
              <div>
                 <p className="text-sm font-black text-slate-800">GSTR-1 (Current Month)</p>
                 <p className="text-xs text-slate-400 font-medium">Ready for portal upload</p>
              </div>
           </div>
           <Button variant="primary" size="sm" className="w-full mt-4 flex items-center justify-center gap-2">
              <DownloadIcon size={14} /> Download JSON
           </Button>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
           <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">GSTR-1 Summary (B2B)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Receiver GSTIN</th>
                <th className="px-6 py-4">Invoice Value</th>
                <th className="px-6 py-4">Taxable Value</th>
                <th className="px-6 py-4">Central Tax</th>
                <th className="px-6 py-4">State Tax</th>
                <th className="px-6 py-4">Total GST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(gstData?.b2bInvoices || []).map((row: any, idx: number) => (
                <tr key={idx} className="text-sm hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{row.receiverGst}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">₹{row.totalValue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">₹{row.taxableValue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">₹{row.cgst.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">₹{row.sgst.toLocaleString()}</td>
                  <td className="px-6 py-4 font-black text-indigo-600">₹{row.totalTax.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
