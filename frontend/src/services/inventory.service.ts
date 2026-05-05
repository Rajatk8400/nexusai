export { inventoryApi } from "./api";
import { inventoryApi } from "./api";

// backwards compatibility — old method names mapped to new API
export const inventoryApiCompat = {
  list: (params?: any) => inventoryApi.getStock(params),
  getStock: (params?: any) => inventoryApi.getStock(params),
  adjust: (data: any) => inventoryApi.adjust(data),
  getLowStock: (branchId?: string) => inventoryApi.getLowStock(branchId),
  getLowStockAlerts: (branchId?: string) => inventoryApi.getLowStock(branchId),
  getMovements: (params?: any) => inventoryApi.getMovements(params),
  stockValueReport: (branchId?: string) => inventoryApi.stockValueReport(branchId),
};