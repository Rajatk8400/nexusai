import { useState, useEffect } from "react";
import { reportApi } from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [month, year]);

  async function loadReport() {
    try {
      setLoading(true);
      const res = await reportApi.getGSTR1({ month, year });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const downloadCSV = () => {
    if (!data) return;
    
    // Simple CSV generation for B2C small sales
    let csv = "Invoice Number,Date,Taxable Value,Tax Amount,Total Value\n";
    const b2c = data.b2cInvoices || [];
    b2c.forEach((s: any) => {
      csv += `${s.invoiceNumber},${new Date(s.date).toLocaleDateString()},${s.taxableValue},${s.totalTax},${s.totalValue}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `GSTR1_${month}_${year}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">GST & Tax Reports</h1>
          <p className="text-slate-500 text-sm">Download your GSTR-1 and sales tax summaries</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={month} 
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm"
          >
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button variant="primary" size="sm" onClick={downloadCSV} disabled={!data || loading}>
            Download CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-bold text-slate-400">Loading tax data...</div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Monthly Sales</span>
              <p className="text-3xl font-black mt-1">₹{data.summary.totalRevenue.toLocaleString("en-IN")}</p>
              <p className="text-xs mt-2 opacity-80">{data.summary.totalSales} Invoices Generated</p>
            </Card>
            <Card className="p-6 bg-white">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxable Value</span>
              <p className="text-3xl font-black text-slate-800 mt-1">₹{(data.summary.totalRevenue - data.summary.totalTax).toLocaleString("en-IN")}</p>
              <p className="text-xs mt-2 text-slate-400 font-medium italic">Net amount before GST</p>
            </Card>
            <Card className="p-6 bg-white border-l-4 border-l-emerald-500">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total GST Collected</span>
              <p className="text-3xl font-black text-emerald-600 mt-1">₹{data.summary.totalTax.toLocaleString("en-IN")}</p>
              <p className="text-xs mt-2 text-slate-400 font-medium italic">Ready for GSTR-1 filing</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* HSN Summary Table */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">HSN-wise Summary</h3>
                <span className="text-[10px] font-bold text-slate-400">{data.hsn.length} Codes</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-3">HSN Code</th>
                      <th className="px-6 py-3">Qty</th>
                      <th className="px-6 py-3 text-right">Taxable Val</th>
                      <th className="px-6 py-3 text-right">Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.hsn.map((h: any, i: number) => (
                      <tr key={i} className="text-sm hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-bold text-slate-800">{h.hsn}</td>
                        <td className="px-6 py-3 text-slate-500">{h.qty}</td>
                        <td className="px-6 py-3 text-right text-slate-700 font-medium">₹{h.taxableVal.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-emerald-600 font-bold">₹{h.tax.toLocaleString()}</td>
                      </tr>
                    ))}
                    {data.hsn.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No HSN data found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* B2B Table (if any) */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">B2B Sales (GST Customers)</h3>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{(data.b2bInvoices || []).length} Invoices</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-3">Invoice</th>
                      <th className="px-6 py-3">Customer GSTIN</th>
                      <th className="px-6 py-3 text-right">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data.b2bInvoices || []).map((s: any, i: number) => (
                      <tr key={i} className="text-sm hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-bold text-slate-800">{s.invoiceNumber}</td>
                        <td className="px-6 py-3 text-slate-500 font-mono text-xs">{s.receiverGst}</td>
                        <td className="px-6 py-3 text-right text-slate-800 font-black">₹{s.totalValue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!data.b2bInvoices || data.b2bInvoices.length === 0) && (
                      <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 font-medium">No B2B sales this month</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center font-bold text-slate-400">No data available for this period.</div>
      )}
    </div>
  );
}
