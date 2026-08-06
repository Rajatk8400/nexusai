// ──────────────────────────────────────────────────────────────
// NexusAI API Client — MongoDB edition
// Handles _id → id normalisation from MongoDB responses
// ──────────────────────────────────────────────────────────────

const BASE_URL = (import.meta as any).env["VITE_API_URL"] ?? "http://localhost:4000/api/v1";

// ── Token storage ─────────────────────────────────────────────
const TOKEN_KEY = "nexusai_access_token";
const REFRESH_KEY = "nexusai_refresh_token";

export function getAccessToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
export function getRefreshToken(): string | null { return localStorage.getItem(REFRESH_KEY); }
export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ── Normalise MongoDB _id → id recursively ────────────────────
function normalise(obj: any): any {
  if (Array.isArray(obj)) return obj.map(normalise);
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = k === "_id" ? "id" : k;
      out[key] = normalise(v);
    }
    return out;
  }
  return obj;
}

// ── Core fetch wrapper ────────────────────────────────────────
let _refreshing: Promise<void> | null = null;

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Token expired — refresh once then retry
  if (res.status === 401 && retry) {
    if (!_refreshing) {
      _refreshing = (async () => {
        const rf = getRefreshToken();
        if (!rf) { clearTokens(); window.location.href = "/login"; return; }
        try {
          const r = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: rf }),
          });
          if (!r.ok) throw new Error("refresh failed");
          const data = await r.json();
          setTokens(data.data.accessToken, data.data.refreshToken);
        } catch {
          clearTokens();
          window.location.href = "/login";
        } finally {
          _refreshing = null;
        }
      })();
    }
    await _refreshing;
    return apiFetch<T>(path, options, false);
  }

  const json = await res.json();
  
  if (res.status === 402) {
    window.location.href = "/billing/expired";
    return null as any;
  }

  if (res.status === 403 && json.message?.toLowerCase().includes("suspended")) {
    window.location.href = "/billing/suspended";
    return null as any;
  }

  if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
  return normalise(json.data) as T;
}

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; businessName: string }) =>
    apiFetch<any>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    apiFetch<any>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  forgotPassword: (email: string) =>
    apiFetch<any>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  resetPassword: (email: string, newPassword: string) =>
    apiFetch<any>("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, newPassword }) }),

  logout: () => apiFetch<any>("/auth/logout", { method: "POST" }),

  profile: () => apiFetch<any>("/auth/profile"),

  refresh: (refreshToken: string) =>
    apiFetch<any>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  overview: (branchId?: string) =>
    apiFetch<any>(`/dashboard${branchId ? `?branchId=${branchId}` : ""}`),

  getRevenueChart: (months = 7, branchId?: string) =>
    apiFetch<any>(`/dashboard/revenue?months=${months}${branchId ? `&branchId=${branchId}` : ""}`),

  getKPIs: (branchId?: string) =>
    apiFetch<any>(`/dashboard/kpis${branchId ? `?branchId=${branchId}` : ""}`),
};

// ── Products ──────────────────────────────────────────────────
export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  barcode?: string;
  brand?: string;
  category?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  taxRate: number;
  hsnCode?: string;
  reorderLevel: number;
  reorderQuantity: number;
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  inventories?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  brand?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  taxRate: number;
  hsnCode?: string;
  reorderLevel?: number;
  reorderQuantity?: number;
  status?: string;
}

export const productApi = {
  list: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const cleanParams: any = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") {
          cleanParams[k] = v;
        }
      }
    }
    const q = new URLSearchParams(cleanParams).toString();
    return apiFetch<{ items: Product[]; total: number; page: number; pages: number }>(`/products${q ? `?${q}` : ""}`);
  },

  getById: (id: string) => apiFetch<Product>(`/products/${id}`),

  create: (data: Partial<Product>) =>
    apiFetch<Product>("/products", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Product>) =>
    apiFetch<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/products/${id}`, { method: "DELETE" }),

  stockValue: (branchId?: string) =>
    apiFetch<any>(`/products/stock-value${branchId ? `?branchId=${branchId}` : ""}`),
};

// ── Sales ─────────────────────────────────────────────────────
export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountAmt: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  profitAmount: number;
  hsnCode?: string;
}

export interface Sale {
  id: string;
  businessId: string;
  branchId: string;
  invoiceNumber: string;
  saleDateAt: string;
  customerName?: string;
  customerPhone?: string;
  customerGst?: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  profitAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  notes?: string;
  ewayBill?: {
    ewayBillNumber?: string;
    transporterName?: string;
    transporterId?: string;
    vehicleNumber?: string;
    distance?: number;
    supplyType?: string;
  };
  metadata?: any;
  createdAt: string;
}

export const saleApi = {
  create: (data: {
    items: { productId: string; quantity: number; unitPrice?: number; discountAmt?: number }[];
    customerName?: string;
    customerPhone?: string;
    customerGst?: string;
    paymentMethod?: string;
    notes?: string;
    saleDateAt?: Date;
    isInterState?: boolean;
    includeGST?: boolean;
    amountPaid?: number;
  }) => apiFetch<Sale>("/sales", { method: "POST", body: JSON.stringify(data) }),

  list: (params?: { status?: string; paymentMethod?: string; from?: string; to?: string; page?: number; limit?: number }) => {
    const clean: any = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") clean[k] = v;
      }
    }
    const q = new URLSearchParams(clean).toString();
    return apiFetch<{ items: Sale[]; total: number; page: number; pages: number }>(`/sales${q ? `?${q}` : ""}`);
  },

  getById: (id: string) => apiFetch<Sale>(`/sales/${id}`),
  updateEwayBill: (id: string, data: any) => apiFetch<Sale>(`/sales/${id}/eway-bill`, { method: "PUT", body: JSON.stringify(data) }),
};

// ── Inventory ─────────────────────────────────────────────────
export const inventoryApi = {
  getStock: (params?: { branchId?: string; productId?: string }) => {
    const clean: any = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") clean[k] = v;
      }
    }
    const q = new URLSearchParams(clean).toString();
    return apiFetch<any[]>(`/inventory${q ? `?${q}` : ""}`);
  },

  adjust: (data: { productId: string; quantity: number; type?: string; notes?: string; unitCost?: number }) =>
    apiFetch<any>("/inventory/adjust", { method: "POST", body: JSON.stringify(data) }),

  getLowStock: (branchId?: string, threshold?: number) => {
    const params = new URLSearchParams();
    if (branchId) params.set("branchId", branchId);
    if (threshold !== undefined) params.set("threshold", String(threshold));
    return apiFetch<any[]>(`/inventory/low-stock${params.toString() ? `?${params}` : ""}`);
  },

  getMovements: (params?: { productId?: string; branchId?: string; limit?: number }) => {
    const clean: any = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") clean[k] = v;
      }
    }
    const q = new URLSearchParams(clean).toString();
    return apiFetch<any[]>(`/inventory/movements${q ? `?${q}` : ""}`);
  },

  stockValueReport: (branchId?: string) => productApi.stockValue(branchId),
};

// ── AI & Insights ─────────────────────────────────────────────
export const aiApi = {
  getDemandForecast: (productId: string, days = 30) =>
    apiFetch<any>(`/ai/forecast/demand/${productId}?days=${days}`),

  getRevenueForecast: (days = 30) =>
    apiFetch<any>(`/ai/forecast/revenue?days=${days}`),

  getInventoryInsights: () =>
    apiFetch<any[]>("/ai/inventory-insights"),

  getStaffProductivity: () =>
    apiFetch<any[]>("/ai/staff-productivity"),

  getBusinessInsights: () =>
    apiFetch<any>("/ai/business-insights"),
};

export const documentApi = {
  list: (type?: string) => apiFetch<any[]>(`/documents${type ? `?type=${type}` : ""}`),
  
  upload: (file: File, type: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    
    return fetch(`${BASE_URL}/documents/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getAccessToken()}`
      },
      body: formData
    }).then(res => res.json()).then(json => json.data);
  },

  sendToCa: (documentIds: string[]) => 
    apiFetch<any>("/documents/send-to-ca", { method: "POST", body: JSON.stringify({ documentIds }) }),

  delete: (id: string) => 
    apiFetch<any>(`/documents/${id}`, { method: "DELETE" }),
};

export const customerApi = {
  list: (params: any = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch<any>(`/customers${qs ? `?${qs}` : ""}`);
  },
  getById: (id: string) => apiFetch<any>(`/customers/${id}`),
  getTransactions: (id: string) => apiFetch<any[]>(`/customers/${id}/transactions`),
  getTrustScore: (id: string) => apiFetch<any>(`/customers/${id}/trust-score`),
  recordTransaction: (id: string, data: any) => apiFetch<any>(`/customers/${id}/transactions`, { method: "POST", body: JSON.stringify(data) }),
};

export const reportApi = {
  getGSTR1: (params: { month: number; year: number }) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiFetch<any>(`/reports/gstr1?${qs}`);
  },
};

export const campaignApi = {
  getStats: () => apiFetch<any>("/campaigns/stats"),
  send: (data: any) => apiFetch<any>("/campaigns/send", { method: "POST", body: JSON.stringify(data) }),
};

export const expenseApi = {
  list: (params: any = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch<any>(`/expenses${qs ? `?${qs}` : ""}`);
  },
  create: (data: any) => apiFetch<any>("/expenses", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/expenses/${id}`, { method: "DELETE" }),
};

export const purchaseApi = {
  list: (params: any = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch<any>(`/purchases${qs ? `?${qs}` : ""}`);
  },
  create: (data: any) => apiFetch<any>("/purchases", { method: "POST", body: JSON.stringify(data) }),
};

export const adminApi = {
  getStats: () => apiFetch<any>("/admin/stats"),
  getBusinesses: (search?: string) => apiFetch<any[]>(`/admin/businesses${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  approve: (businessId: string) => apiFetch<any>("/admin/approve", { method: "POST", body: JSON.stringify({ businessId }) }),
  updatePlan: (data: { businessId: string; plan?: string; planStatus?: string; planExpiresAt?: string; status?: string }) => 
    apiFetch<any>("/admin/update-plan", { method: "POST", body: JSON.stringify(data) }),
};

export const supplierApi = {
  list: () => apiFetch<any[]>("/suppliers"), // If we add suppliers UI later
};


// ── Backwards compatibility exports ───────────────────────────
export class ApiError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export type { ApiError as ApiErrorType };