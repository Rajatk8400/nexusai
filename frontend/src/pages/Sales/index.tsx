import { useState, useEffect } from "react";
import { saleApi, productApi, type Sale, type Product } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { generateBillPDF, generateEwayBillPDF, shareToWhatsApp } from "../../utils/billGenerator";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { exportToExcel } from "../../utils/exportToExcel";

// ── Helpers ──────────────────────────────────────────────────
function fmtINR(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Types ─────────────────────────────────────────────────────
interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  taxRate: number;
  discountAmt: number;
  taxAmount: number;
  totalAmount: number;
  profitAmount: number;
}

// ── Card component ────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] ?? colors.slate}`}>
      {label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function SalesPage() {
  const { business } = useAuth();
  const [tab, setTab] = useState<"list" | "new">("list");
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Bill Modal state
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [ewayModalOpen, setEwayModalOpen] = useState(false);
  const [ewayData, setEwayData] = useState({
    ewayBillNumber: "",
    transporterName: "",
    transporterId: "",
    vehicleNumber: "",
    distance: 0,
    supplyType: "Outward"
  });

  // New Sale form state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isInterState, setIsInterState] = useState(false);
  const [includeGST, setIncludeGST] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  // Load sales and products
  useEffect(() => {
    loadSales();
    loadProducts();
  }, []);

  async function loadSales() {
    try {
      setLoading(true);
      const res = await saleApi.list({ limit: 50 });
      setSales(res.items ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const res = await productApi.list({ status: "ACTIVE", limit: 200 });
      setProducts(res.items ?? []);
    } catch (e: any) {
      console.error(e);
    }
  }

  // Search products
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const q = search.toLowerCase();
    setSearchResults(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? "").toLowerCase().includes(q)
      ).slice(0, 8)
    );
  }, [search, products]);

  // Add product to cart
  function addToCart(product: Product) {
    setSearch("");
    setSearchResults([]);
    const existing = cart.find((c) => c.productId === product.id);
    if (existing) {
      updateQty(product.id, existing.quantity + 1);
      return;
    }
    const unitPrice = product.sellingPrice;
    const qty = 1;
    const lineSubtotal = unitPrice * qty;
    const taxAmount = includeGST ? (lineSubtotal * product.taxRate) / 100 : 0;
    const totalAmount = lineSubtotal + taxAmount;
    const profitAmount = lineSubtotal - product.costPrice * qty;
    
    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        unitPrice,
        costPrice: product.costPrice,
        taxRate: product.taxRate,
        discountAmt: 0,
        taxAmount,
        totalAmount,
        profitAmount,
      },
    ]);
  }

  // Update quantity
  function updateQty(productId: string, qty: number) {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart((prev) =>
      prev.map((c) => {
        if (c.productId !== productId) return c;
        const lineSubtotal = c.unitPrice * qty - c.discountAmt;
        const taxAmount = includeGST ? (lineSubtotal * c.taxRate) / 100 : 0;
        const totalAmount = lineSubtotal + taxAmount;
        const profitAmount = lineSubtotal - c.costPrice * qty;
        return { ...c, quantity: qty, taxAmount, totalAmount, profitAmount };
      })
    );
  }

  // Update price
  function updatePrice(productId: string, price: number) {
    setCart((prev) =>
      prev.map((c) => {
        if (c.productId !== productId) return c;
        const lineSubtotal = price * c.quantity - c.discountAmt;
        const taxAmount = includeGST ? (lineSubtotal * c.taxRate) / 100 : 0;
        const totalAmount = lineSubtotal + taxAmount;
        const profitAmount = lineSubtotal - c.costPrice * c.quantity;
        return { ...c, unitPrice: price, taxAmount, totalAmount, profitAmount };
      })
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  // Totals
  const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity - c.discountAmt, 0);
  const totalTax = cart.reduce((s, c) => s + c.taxAmount, 0);
  const totalAmount = subtotal + totalTax;
  const totalProfit = cart.reduce((s, c) => s + c.profitAmount, 0);

  // Submit sale
  async function submitSale() {
    if (cart.length === 0) { setError("Add at least one product"); return; }
    setSaving(true);
    setError("");
    try {
      const newSale = await saleApi.create({
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          discountAmt: c.discountAmt,
        })),
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        paymentMethod,
        isInterState,
        includeGST,
      });
      setSuccess("Sale created successfully!");
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod("CASH");
      loadSales();
      
      // Open bill options for the new sale
      setSelectedSale(newSale);
      setBillModalOpen(true);
      setTab("list");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Status badge color
  function statusColor(s: string) {
    if (s === "CONFIRMED") return "green";
    if (s === "PENDING") return "yellow";
    if (s === "CANCELLED" || s === "REFUNDED") return "red";
    return "slate";
  }

  function paymentColor(s: string) {
    if (s === "COMPLETED") return "green";
    if (s === "PENDING") return "yellow";
    if (s === "REFUNDED") return "red";
    return "slate";
  }

  const handleExport = () => {
    const exportData = sales.map(s => ({
      InvoiceNo: s.invoiceNumber,
      CustomerName: s.customerName || "Walk-in",
      TotalItems: s.items?.length || 0,
      TotalAmount: s.totalAmount,
      TaxAmount: s.taxAmount,
      ProfitAmount: s.profitAmount,
      PaymentMethod: s.paymentMethod,
      PaymentStatus: s.paymentStatus,
      Date: new Date(s.saleDateAt).toLocaleDateString()
    }));
    exportToExcel(exportData, "Sales_Export");
  };

  const handleUpdateEway = async () => {
    if (!selectedSale) return;
    setSaving(true);
    try {
      await saleApi.updateEwayBill(selectedSale.id, ewayData);
      setSuccess("E-Way Bill details saved!");
      setEwayModalOpen(false);
      loadSales();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openEwayModal = (sale: Sale) => {
    setSelectedSale(sale);
    setEwayData({
      ewayBillNumber: sale.ewayBill?.ewayBillNumber || "",
      transporterName: sale.ewayBill?.transporterName || "",
      transporterId: sale.ewayBill?.transporterId || "",
      vehicleNumber: sale.ewayBill?.vehicleNumber || "",
      distance: sale.ewayBill?.distance || 0,
      supplyType: sale.ewayBill?.supplyType || "Outward"
    });
    setEwayModalOpen(true);
    setBillModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create invoices and view sales history</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Export Excel
          </button>
          <button
            onClick={() => { setTab(tab === "new" ? "list" : "new"); setError(""); setSuccess(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {tab === "new" ? "← Back to List" : "+ New Sale"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}

      {/* ── NEW SALE FORM ── */}
      {tab === "new" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Product search + cart */}
          <div className="lg:col-span-2 space-y-4">
            {/* Product Search */}
            <Card className="p-4">
              <label className="text-sm font-medium text-slate-700 block mb-2">Search Product</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, SKU or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 text-left"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.sku} · GST {p.taxRate}%</p>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">
                          ₹{p.sellingPrice.toLocaleString("en-IN")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Cart */}
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Cart ({cart.length} items)</h3>
              </div>
              {cart.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Search and add products above
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.productId} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.productName}</p>
                          <p className="text-xs text-slate-500">{item.sku} · GST {item.taxRate}%</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-slate-400 hover:text-red-500 text-sm"
                        >✕</button>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        {/* Quantity */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQty(item.productId, item.quantity - 1)}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 text-sm"
                          >−</button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                            className="w-12 text-center text-sm border-x border-slate-200 py-1 focus:outline-none"
                            min={1}
                          />
                          <button
                            onClick={() => updateQty(item.productId, item.quantity + 1)}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 text-sm"
                          >+</button>
                        </div>
                        {/* Price */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">₹</span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updatePrice(item.productId, Number(e.target.value))}
                            className="w-24 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        {/* Line total */}
                        <div className="ml-auto text-right">
                          <p className="text-sm font-semibold text-slate-800">
                            ₹{item.totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-slate-500">
                            Tax: ₹{item.taxAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Customer + Summary */}
          <div className="space-y-4">
            {/* Customer */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-slate-800">Customer (Optional)</h3>
              <input
                type="text"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Card>

            {/* Payment */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-slate-800">Payment</h3>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT">Credit</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInterState}
                  onChange={(e) => setIsInterState(e.target.checked)}
                  className="rounded"
                />
                Inter-state sale (IGST)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGST}
                  onChange={(e) => setIncludeGST(e.target.checked)}
                  className="rounded"
                />
                Enable GST Billing
              </label>
            </Card>

            {/* Summary */}
            <Card className="p-4 space-y-2">
              <h3 className="font-semibold text-slate-800 mb-3">Summary</h3>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax (GST)</span>
                <span>₹{totalTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Est. Profit</span>
                <span>₹{totalProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-800">
                <span>Total</span>
                <span>{fmtINR(totalAmount)}</span>
              </div>
              <button
                onClick={submitSale}
                disabled={saving || cart.length === 0}
                className="w-full mt-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Creating Sale..." : `Confirm Sale · ${fmtINR(totalAmount)}`}
              </button>
            </Card>
          </div>
        </div>
      )}

      {/* ── SALES LIST ── */}
      {tab === "list" && (
        <Card>
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading sales...</div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm mb-3">No sales yet</p>
              <button
                onClick={() => setTab("new")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Create First Sale
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Items</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Profit</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 font-medium">
                        {sale.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {sale.customerName ?? <span className="text-slate-400 italic">Walk-in</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {sale.items?.length ?? 0} item{(sale.items?.length ?? 0) !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {fmtINR(sale.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={sale.profitAmount >= 0 ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                          {fmtINR(sale.profitAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={sale.paymentMethod} color="blue" />
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={sale.paymentStatus} color={paymentColor(sale.paymentStatus)} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {fmtDate(sale.saleDateAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setSelectedSale(sale); setBillModalOpen(true); }}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs uppercase tracking-wider"
                        >
                          Bill Options
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Bill Options Modal */}
      <Modal
        open={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        title="Invoice Options"
        size="md"
      >
        {selectedSale && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Invoice #{selectedSale.invoiceNumber}</h3>
              <p className="text-slate-500 text-sm mt-1">Total: ₹{selectedSale.totalAmount.toLocaleString("en-IN")}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  const doc = generateBillPDF(selectedSale, business?.name || "NexusAI Business", (business as any)?.gstNumber);
                  doc.save(`Invoice_${selectedSale.invoiceNumber}.pdf`);
                }}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">Download PDF</p>
                    <p className="text-xs text-slate-500">Save a copy to your device</p>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-blue-500"><polyline points="9 18 15 12 9 6"/></svg>
              </button>

              <button
                onClick={() => {
                  if (selectedSale) shareToWhatsApp(selectedSale, business?.name || "NexusAI Business", (business as any)?.upiId);
                }}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-emerald-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">Send via WhatsApp</p>
                    <p className="text-xs text-slate-500">Share details with customer</p>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-green-500"><polyline points="9 18 15 12 9 6"/></svg>
              </button>

              <button
                onClick={() => openEwayModal(selectedSale)}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-amber-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center group-hover:bg-amber-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">E-Way Bill</p>
                    <p className="text-xs text-slate-500">Generate transporter document</p>
                  </div>
                </div>
                {selectedSale.ewayBill?.ewayBillNumber ? (
                  <Badge label="Active" color="green" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-amber-500"><polyline points="9 18 15 12 9 6"/></svg>
                )}
              </button>

              <button
                onClick={() => {
                  const doc = generateBillPDF(selectedSale, business?.name || "NexusAI Business", (business as any)?.gstNumber);
                  doc.autoPrint();
                  window.open(doc.output('bloburl'), '_blank');
                }}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center group-hover:bg-slate-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">Print Receipt</p>
                    <p className="text-xs text-slate-500">Send to connected printer</p>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-slate-500"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            
            <div className="pt-2">
              <Button variant="secondary" onClick={() => setBillModalOpen(false)} className="w-full">Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* E-Way Bill Modal */}
      <Modal
        open={ewayModalOpen}
        onClose={() => setEwayModalOpen(false)}
        title="E-Way Bill Generation"
        size="md"
      >
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">E-Way Bill Number</label>
              <input 
                type="text"
                placeholder="12-digit number"
                className="w-full p-2 border rounded-xl text-sm"
                value={ewayData.ewayBillNumber}
                onChange={(e) => setEwayData({...ewayData, ewayBillNumber: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Supply Type</label>
              <select 
                className="w-full p-2 border rounded-xl text-sm"
                value={ewayData.supplyType}
                onChange={(e) => setEwayData({...ewayData, supplyType: e.target.value})}
              >
                <option value="Outward">Outward</option>
                <option value="Inward">Inward</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Transporter Name</label>
            <input 
              type="text"
              placeholder="e.g. Blue Dart, Delhivery"
              className="w-full p-2 border rounded-xl text-sm"
              value={ewayData.transporterName}
              onChange={(e) => setEwayData({...ewayData, transporterName: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Vehicle Number</label>
              <input 
                type="text"
                placeholder="e.g. MH-12-AB-1234"
                className="w-full p-2 border rounded-xl text-sm"
                value={ewayData.vehicleNumber}
                onChange={(e) => setEwayData({...ewayData, vehicleNumber: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Distance (KM)</label>
              <input 
                type="number"
                className="w-full p-2 border rounded-xl text-sm"
                value={ewayData.distance}
                onChange={(e) => setEwayData({...ewayData, distance: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={handleUpdateEway}
              disabled={saving}
            >
              Save Details
            </Button>
            <Button 
              variant="primary" 
              className="flex-1"
              onClick={() => {
                if (selectedSale) {
                  const doc = generateEwayBillPDF(selectedSale, business?.name || "NexusAI Business", (business as any)?.gstNumber);
                  doc.save(`EWayBill_${selectedSale.invoiceNumber}.pdf`);
                }
              }}
            >
              Print Preview
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}