export { productApi, type Product, type CreateProductData } from "./api";
import { productApi, inventoryApi } from "./api";

export type LowStockAlert = {
  productId: string;
  name: string;
  sku: string;
  quantityOnHand: number;
  reorderPoint: number;
  branchId: string;
};

// backwards compatibility
export const productApiCompat = {
  ...productApi,
  getLowStockAlerts: (branchId?: string) => inventoryApi.getLowStock(branchId),
};