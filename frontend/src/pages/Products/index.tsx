import { useState, useEffect } from "react";
import { productApi, type Product, type CreateProductData } from "../../services/product.service";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Input, { Select } from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";
import { ApiError } from "../../services/api";
import { exportToExcel } from "../../utils/exportToExcel";

const UNITS = ["unit", "kg", "g", "litre", "ml", "piece", "box", "pack", "dozen", "metre", "cm"];
const TAX_RATES = [0, 5, 12, 18, 28];
const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DRAFT", label: "Draft" },
];

interface ProductForm extends CreateProductData {
  initialStock: number;
}

const EMPTY_FORM: ProductForm = {
  name: "",
  sku: "",
  brand: "",
  unit: "unit",
  costPrice: 0,
  sellingPrice: 0,
  mrp: 0,
  taxRate: 18,
  hsnCode: "",
  reorderLevel: 5,
  reorderQuantity: 10,
  initialStock: 0,
  status: "ACTIVE",
};

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>({ ...EMPTY_FORM });

  // Delete confirmation
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const branchId = user?.branchId ?? "";
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchProducts();
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productApi.list({ 
        page, 
        limit: PAGE_SIZE, 
        search: search || undefined,
        status: statusFilter || undefined
      });
      setProducts((res.items ?? []) as Product[]);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm({ ...EMPTY_FORM });
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      sku: p.sku,
      brand: p.brand ?? "",
      unit: p.unit,
      costPrice: Number(p.costPrice),
      sellingPrice: Number(p.sellingPrice),
      mrp: Number(p.mrp ?? 0),
      taxRate: Number(p.taxRate),
      hsnCode: p.hsnCode ?? "",
      reorderLevel: p.reorderLevel,
      reorderQuantity: p.reorderQuantity,
      initialStock: 0,
      status: p.status,
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku || form.costPrice < 0 || form.sellingPrice < 0) {
      setSaveError("Please fill all required fields correctly");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const payload: any = { ...form };
      if (!editProduct) {
        payload.branchId = branchId || undefined;
      }

      if (editProduct) {
        await productApi.update(editProduct.id, payload);
        setSuccess(`"${form.name}" updated successfully`);
      } else {
        await productApi.create(payload);
        setSuccess(`"${form.name}" added successfully`);
      }

      setModalOpen(false);
      fetchProducts();
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      await productApi.delete(deleteProduct.id);
      setSuccess(`"${deleteProduct.name}" deleted`);
      setDeleteProduct(null);
      fetchProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete product");
      setDeleteProduct(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const exportData = products.map(p => ({
      ID: p.id,
      Name: p.name,
      SKU: p.sku,
      Brand: p.brand || "",
      Category: p.category || "",
      Unit: p.unit,
      CostPrice: p.costPrice,
      SellingPrice: p.sellingPrice,
      MRP: p.mrp || 0,
      TaxRate: p.taxRate,
      HSNCode: p.hsnCode || "",
      Status: p.status,
      ReorderLevel: p.reorderLevel,
      CurrentStock: p.inventories?.reduce((s, inv) => s + Number(inv.quantityAvailable), 0) ?? 0
    }));
    exportToExcel(exportData, "Products_Export");
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const margin = form.sellingPrice > 0 
    ? (((form.sellingPrice - form.costPrice) / form.sellingPrice) * 100).toFixed(1)
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Product Catalog</h2>
          <p className="text-slate-400 text-sm mt-0.5">Manage your items, pricing, and stock levels</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleExport} className="shadow-sm">
            Export Excel
          </Button>
          <Button variant="primary" onClick={openAdd} className="shadow-lg shadow-blue-500/20">
            + Add New Product
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Total Products</p>
          <p className="text-3xl font-black mt-1">{total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Items</p>
          <p className="text-3xl font-black text-slate-800 mt-1">
            {products.filter(p => p.status === "ACTIVE").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Low Stock Alerts</p>
          <p className="text-3xl font-black text-amber-500 mt-1">
            {products.filter(p => {
              const stock = p.inventories?.reduce((s, inv) => s + Number(inv.quantityAvailable), 0) ?? 0;
              return stock <= p.reorderLevel && stock > 0;
            }).length}
          </p>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, brand or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      {/* Products Table */}
      <Card className="overflow-hidden border-slate-100">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-20 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-black text-slate-800 text-xl mb-2">No products found</h3>
            <p className="text-slate-400 max-w-sm mx-auto mb-8">
              {search || statusFilter 
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Your catalog is empty. Start by adding your first product."}
            </p>
            {!search && !statusFilter && (
              <Button variant="primary" onClick={openAdd}>+ Add Your First Product</Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Product Info</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">SKU / Brand</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Stock Status</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Pricing (₹)</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tax / Status</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map((p) => {
                    const stock = p.inventories?.reduce((s, inv) => s + Number(inv.quantityAvailable), 0) ?? 0;
                    const isLow = stock <= p.reorderLevel && stock > 0;
                    const isOut = stock === 0;
                    
                    return (
                      <tr key={p.id} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border border-blue-200/50 shadow-sm">
                              <span className="text-base font-black text-blue-600">
                                {p.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-base leading-tight">{p.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{p.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-[11px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg shadow-sm">
                            {p.sku}
                          </span>
                          <p className="text-xs text-slate-400 mt-1 font-medium">{p.brand || "Generic"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-black ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600"}`}>
                                {stock} units
                              </span>
                              {isOut ? (
                                <Badge variant="danger" className="scale-75 origin-left">Out of Stock</Badge>
                              ) : isLow ? (
                                <Badge variant="warning" className="scale-75 origin-left">Low Stock</Badge>
                              ) : (
                                <Badge variant="success" className="scale-75 origin-left">Healthy</Badge>
                              )}
                            </div>
                            <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isOut ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-emerald-400"}`} 
                                style={{ width: `${Math.min(100, (stock / (p.reorderLevel * 2)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-800 font-black">₹{Number(p.sellingPrice).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Cost: ₹{Number(p.costPrice).toLocaleString()}</span>
                            {Number(p.sellingPrice) > Number(p.costPrice) && (
                              <span className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                +{(((Number(p.sellingPrice) - Number(p.costPrice)) / Number(p.sellingPrice)) * 100).toFixed(0)}% Margin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500">{p.taxRate}% GST</span>
                            <Badge variant={p.status === "ACTIVE" ? "success" : "default"}>
                              {p.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(p)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                              title="Edit Product"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button
                              onClick={() => setDeleteProduct(p)}
                              className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                              title="Delete Product"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                          </div>
                          {/* Visible in mobile or when not hovered */}
                          <div className="flex items-center justify-end gap-1 group-hover:hidden">
                             <button onClick={() => openEdit(p)} className="text-blue-600 text-xs font-bold uppercase tracking-tight hover:underline">Edit</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-bold text-slate-800">{(page-1)*PAGE_SIZE + 1}</span> to <span className="font-bold text-slate-800">{Math.min(page*PAGE_SIZE, total)}</span> of <span className="font-bold text-slate-800">{total}</span> products
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          page === i + 1 
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                            : "bg-white text-slate-400 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? "Edit Product Details" : "Create New Product"}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Processing..." : editProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {saveError && <Alert type="danger" message={saveError} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">General Information</p>
              <Input
                label="Product Name *"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Premium Basmati Rice"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="SKU / Item Code *"
                  value={form.sku}
                  onChange={(e) => setForm(f => ({ ...f, sku: e.target.value.toUpperCase() }))}
                  placeholder="AUTO-GEN"
                />
                <Input
                  label="Brand"
                  value={form.brand}
                  onChange={(e) => setForm(f => ({ ...f, brand: e.target.value }))}
                  placeholder="e.g. India Gate"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Unit of Measure"
                  value={form.unit}
                  onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                  options={UNITS.map(u => ({ value: u, label: u.toUpperCase() }))}
                />
                <Select
                  label="Product Status"
                  value={form.status}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.value as any }))}
                  options={STATUS_OPTIONS.filter(o => o.value).map(o => ({ value: o.value, label: o.label }))}
                />
              </div>
            </div>

            {/* Pricing & Tax */}
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pricing & Financials</p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Cost Price (₹) *"
                  type="number"
                  value={String(form.costPrice)}
                  onChange={(e) => setForm(f => ({ ...f, costPrice: Number(e.target.value) }))}
                  placeholder="0.00"
                />
                <Input
                  label="Selling Price (₹) *"
                  type="number"
                  value={String(form.sellingPrice)}
                  onChange={(e) => setForm(f => ({ ...f, sellingPrice: Number(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="MRP (₹)"
                  type="number"
                  value={String(form.mrp)}
                  onChange={(e) => setForm(f => ({ ...f, mrp: Number(e.target.value) }))}
                  placeholder="0.00"
                />
                <Select
                  label="Tax Rate (GST)"
                  value={String(form.taxRate)}
                  onChange={(e) => setForm(f => ({ ...f, taxRate: Number(e.target.value) }))}
                  options={TAX_RATES.map(r => ({ value: String(r), label: `${r}% GST` }))}
                />
              </div>
              
              {margin && Number(margin) > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-xs font-bold text-emerald-700">Profit Margin: {margin}%</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Approx. profit per unit: ₹{(form.sellingPrice - form.costPrice).toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Inventory Settings</p>
                   <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Reorder Level"
                        type="number"
                        value={String(form.reorderLevel)}
                        onChange={(e) => setForm(f => ({ ...f, reorderLevel: Number(e.target.value) }))}
                        helper="Stock to trigger alert"
                      />
                      <Input
                        label="Reorder Qty"
                        type="number"
                        value={String(form.reorderQuantity)}
                        onChange={(e) => setForm(f => ({ ...f, reorderQuantity: Number(e.target.value) }))}
                        helper="Qty to purchase"
                      />
                   </div>
                </div>
                {!editProduct && (
                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-blue-600">Initial Stock</p>
                    <Input
                      label="Current On Hand"
                      type="number"
                      value={String(form.initialStock)}
                      onChange={(e) => setForm(f => ({ ...f, initialStock: Number(e.target.value) }))}
                      placeholder="0"
                      helper="Opening balance for this product"
                    />
                  </div>
                )}
             </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        title="Delete Product"
        size="sm"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" onClick={() => setDeleteProduct(null)}>Keep Product</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </div>
          <p className="text-slate-800 font-black text-lg">Are you sure?</p>
          <p className="text-slate-500 text-sm mt-2 px-4">
            You are about to delete <span className="font-bold text-slate-800">{deleteProduct?.name}</span>. 
            This action will hide the product and all associated inventory records.
          </p>
        </div>
      </Modal>
    </div>
  );
}