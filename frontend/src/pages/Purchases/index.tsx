import { useState, useEffect } from "react";
import { purchaseApi, productApi, supplierApi, type Product } from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  taxRate: number;
  totalAmount: number;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"list" | "new">("list");

  // New Purchase State
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [purchaseNumber, setPurchaseNumber] = useState(`PO-${Date.now().toString().slice(-6)}`);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPurchases();
    loadProducts();
    // In a real app, loadSuppliers();
  }, []);

  async function loadPurchases() {
    try {
      setLoading(true);
      const res = await purchaseApi.list();
      setPurchases(res.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadProducts() {
    try {
      const res = await productApi.list({ limit: 100 });
      setProducts(res.items || []);
    } catch (e) { console.error(e); }
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1, totalAmount: (item.quantity + 1) * item.unitCost * (1 + item.taxRate/100) } : item));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitCost: product.costPrice,
        taxRate: product.taxRate,
        totalAmount: product.costPrice * (1 + product.taxRate/100)
      }]);
    }
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.productId !== id));

  const handleSave = async () => {
    if (!supplierId || cart.length === 0) return alert("Select supplier and add items");
    setSaving(true);
    try {
      await purchaseApi.create({
        supplierId,
        purchaseNumber,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          taxRate: item.taxRate
        }))
      });
      alert("Stock updated successfully");
      setTab("list");
      setCart([]);
      setSupplierId("");
      loadPurchases();
    } catch (e) {
      alert("Error recording purchase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Purchase & Stock In</h1>
          <p className="text-slate-500 text-sm font-medium">Restock your inventory and manage supplier invoices</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setTab("list")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === "list" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
          >
            History
          </button>
          <button 
            onClick={() => setTab("new")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === "new" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
          >
            New Stock In
          </button>
        </div>
      </div>

      {tab === "list" ? (
        <Card className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4 text-right">Total Value</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold">Loading purchase history...</td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold">No purchase records found.</td></tr>
              ) : purchases.map(p => (
                <tr key={p.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(p.purchaseDateAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{p.purchaseNumber}</td>
                  <td className="px-6 py-4 text-slate-600">{p.items.length} products</td>
                  <td className="px-6 py-4 text-right font-black text-slate-800">₹{p.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase tracking-wider">Received</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                 <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">1. Select Products</h3>
                 <input type="text" placeholder="Search product..." className="text-xs bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {products.map(product => (
                  <button 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">{product.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-700">₹{product.costPrice}</p>
                      <p className="text-[9px] text-blue-500 font-bold">+ Add</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
               <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-4">2. Review Items</h3>
               <div className="space-y-3">
                 {cart.map(item => (
                   <div key={item.productId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{item.productName}</p>
                        <div className="flex items-center gap-3 mt-1">
                           <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
                              <span className="text-[10px] font-bold text-slate-400">Qty:</span>
                              <input 
                                type="number" 
                                value={item.quantity} 
                                onChange={(e) => {
                                   const val = parseInt(e.target.value) || 0;
                                   setCart(cart.map(c => c.productId === item.productId ? {...c, quantity: val, totalAmount: val * c.unitCost * (1 + c.taxRate/100)} : c));
                                }}
                                className="w-10 text-xs font-bold outline-none text-center" 
                              />
                           </div>
                           <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
                              <span className="text-[10px] font-bold text-slate-400">Cost: ₹</span>
                              <input 
                                type="number" 
                                value={item.unitCost} 
                                onChange={(e) => {
                                   const val = parseFloat(e.target.value) || 0;
                                   setCart(cart.map(c => c.productId === item.productId ? {...c, unitCost: val, totalAmount: item.quantity * val * (1 + c.taxRate/100)} : c));
                                }}
                                className="w-16 text-xs font-bold outline-none" 
                              />
                           </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-black text-slate-800">₹{item.totalAmount.toLocaleString()}</p>
                        <button onClick={() => removeFromCart(item.productId)} className="text-[9px] text-red-500 font-bold hover:underline mt-1">Remove</button>
                      </div>
                   </div>
                 ))}
                 {cart.length === 0 && <div className="py-12 text-center text-slate-400 font-medium italic text-sm">Add products from the list to start stocking up</div>}
               </div>
            </Card>
          </div>

          <Card className="p-6 space-y-6 sticky top-6">
             <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">3. Finalize Purchase</h3>
             <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter Supplier Name (e.g. ABC Wholesalers)"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all text-sm shadow-inner"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice / PO Number</label>
                  <input 
                    type="text" 
                    value={purchaseNumber}
                    onChange={(e) => setPurchaseNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all text-sm shadow-inner"
                  />
               </div>
             </div>

             <div className="pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                   <span className="text-sm font-bold text-slate-500">Total Items</span>
                   <span className="text-sm font-black text-slate-800">{cart.reduce((acc, i) => acc + i.quantity, 0)} units</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-sm font-bold text-slate-500">Total Value</span>
                   <span className="text-xl font-black text-slate-900">₹{cart.reduce((acc, i) => acc + i.totalAmount, 0).toLocaleString()}</span>
                </div>
                <Button variant="primary" fullWidth size="lg" className="mt-4" onClick={handleSave} disabled={saving || cart.length === 0}>
                   {saving ? "Saving..." : "Record Stock In"}
                </Button>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
}
