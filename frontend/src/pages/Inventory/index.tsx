import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { inventoryApiCompat as inventoryApi } from "../../services/inventory.service";
import { productApi, type Product } from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Input, { Select } from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";
import { ApiError } from "../../services/api";

interface InventoryItem {
  id: string;
  product: Product;
  branch: { id: string; name: string; code: string };
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  averageCost: number;
  lastRestockedAt?: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

interface StockValueReport {
  totalStockValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  lowStockCount: number;
  totalProducts: number;
}

function HealthBar({ value }: { value: number }) {
  const color = value > 0 ? "bg-emerald-500" : "bg-red-400";
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums w-8">{value}</span>
    </div>
  );
}

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [report, setReport] = useState<StockValueReport | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    productId: "", branchId: "", quantity: "", type: "ADJUSTMENT" as const, notes: "",
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [inv, rep, prods] = await Promise.all([
        inventoryApi.getStock({ branchId: user?.branchId }),
        inventoryApi.stockValueReport(),
        productApi.list({ limit: 100 }),
      ]);
      setItems((inv ?? []) as InventoryItem[]);
      setReport(rep);
      setProducts((prods.items ?? []) as Product[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjustForm.productId || !adjustForm.branchId || !adjustForm.quantity) {
      setAdjustError("All fields are required");
      return;
    }
    setAdjustLoading(true);
    setAdjustError(null);
    try {
      await inventoryApi.adjust({
        productId: adjustForm.productId,
        branchId: adjustForm.branchId,
        quantity: Number(adjustForm.quantity),
        type: adjustForm.type,
        notes: adjustForm.notes,
      });
      setSuccess("Stock adjusted successfully");
      setAdjustOpen(false);
      setAdjustForm({ productId: "", branchId: "", quantity: "", type: "ADJUSTMENT", notes: "" });
      fetchAll();
    } catch (e) {
      setAdjustError(e instanceof ApiError ? e.message : "Adjustment failed");
    } finally {
      setAdjustLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  const outOfStock = items.filter((i) => i?.isOutOfStock).length;
  const lowStock = items.filter((i) => i?.isLowStock && !i?.isOutOfStock).length;
  const productOptions = products.filter(p => p).map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));
  
  const branchOptions = Array.from(
    new Map(
      items
        .filter(i => i?.branch)
        .map((i) => [i.branch!.id, i.branch!])
    ).values()
  ).map((b) => ({ value: b.id, label: `${b.name} (${b.code})` }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Inventory</h2>
          <p className="text-slate-400 text-sm">Real-time stock levels across all branches</p>
        </div>
        <Button variant="primary" onClick={() => { setAdjustOpen(true); setAdjustError(null); }}>
          + Adjust Stock
        </Button>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="p-5 border-t-2 border-t-blue-500">
            <p className="text-xs font-medium text-slate-500 mb-1">Total Items</p>
            <p className="text-2xl font-black text-slate-800">{items.length}</p>
            <p className="text-xs text-slate-400 mt-1">Across all branches</p>
          </Card>
          <Card className="p-5 border-t-2 border-t-emerald-500">
            <p className="text-xs font-medium text-slate-500 mb-1">Stock Value (Cost)</p>
            <p className="text-2xl font-black text-slate-800">
              ₹{(report.totalStockValue / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-slate-400 mt-1">At average cost</p>
          </Card>
          <Card className="p-5 border-t-2 border-t-amber-400">
            <p className="text-xs font-medium text-slate-500 mb-1">Retail Value</p>
            <p className="text-2xl font-black text-slate-800">
              ₹{(report.totalRetailValue / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-slate-400 mt-1">Potential revenue</p>
          </Card>
          <Card className="p-5 border-t-2 border-t-red-400">
            <p className="text-xs font-medium text-slate-500 mb-1">Alerts</p>
            <p className="text-2xl font-black text-red-600">{outOfStock + lowStock}</p>
            <p className="text-xs text-slate-400 mt-1">{outOfStock} out of stock, {lowStock} low</p>
          </Card>
        </div>
      )}

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">All Stock</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                {["Product","SKU","Branch","On Hand","Available","Reserved","Avg Cost","Sell Price","Status","Last Restocked"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-sm text-slate-400">
                    No inventory records yet. Create products and add stock.
                  </td>
                </tr>
              ) : items.filter(i => i).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                        {inv.product?.name?.charAt(0) ?? "?"}
                      </div>
                      <span className="text-sm font-semibold text-slate-700 max-w-36 truncate">
                        {inv.product?.name ?? "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                      {inv.product?.sku ?? "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{inv.branch?.name ?? "Unknown Branch"}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                    {Number(inv.quantityOnHand).toFixed(0)} {inv.product?.unit ?? ""}
                  </td>
                  <td className="px-4 py-3">
                    <HealthBar value={Number(inv.quantityAvailable)} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {Number(inv.quantityReserved).toFixed(0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    ₹{Number(inv.averageCost).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                    ₹{Number(inv.product?.sellingPrice ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {inv.isOutOfStock ? (
                      <Badge variant="danger">Out of Stock</Badge>
                    ) : inv.isLowStock ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">In Stock</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {inv.lastRestockedAt
                      ? new Date(inv.lastRestockedAt).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stock Adjustment Modal */}
      <Modal
        open={adjustOpen}
        onClose={() => { setAdjustOpen(false); setAdjustError(null); }}
        title="Adjust Stock"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdjust} disabled={adjustLoading}>
              {adjustLoading ? "Saving..." : "Save Adjustment"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {adjustError && <Alert type="danger" message={adjustError} />}
          <Select
            label="Product"
            value={adjustForm.productId}
            onChange={(e) => setAdjustForm((f) => ({ ...f, productId: e.target.value }))}
            options={[{ value: "", label: "Select product..." }, ...productOptions]}
          />
          <Select
            label="Branch"
            value={adjustForm.branchId}
            onChange={(e) => setAdjustForm((f) => ({ ...f, branchId: e.target.value }))}
            options={[{ value: "", label: "Select branch..." }, ...branchOptions]}
          />
          <Select
            label="Type"
            value={adjustForm.type}
            onChange={(e) => setAdjustForm((f) => ({
              ...f, type: e.target.value as typeof adjustForm.type,
            }))}
            options={[
              { value: "ADJUSTMENT", label: "Manual Adjustment" },
              { value: "DAMAGE", label: "Damage" },
              { value: "EXPIRED", label: "Expired" },
              { value: "RETURN", label: "Customer Return" },
            ]}
          />
          <Input
            label="Quantity (use negative to remove)"
            type="number"
            value={adjustForm.quantity}
            onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))}
            placeholder="e.g. 50 or -10"
            helper="Positive adds stock, negative removes"
          />
          <Input
            label="Notes"
            value={adjustForm.notes}
            onChange={(e) => setAdjustForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Reason for adjustment..."
          />
        </div>
      </Modal>
    </div>
  );
}
