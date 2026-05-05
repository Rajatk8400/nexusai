export { dashboardApi } from "./api";
import { dashboardApi, productApi, inventoryApi, saleApi } from "./api";

export type DashboardStats = any;
export type RevenueChartPoint = any;

export const dashboardApiCompat = {
  ...dashboardApi,
  getStats: (branchId?: string) => dashboardApi.overview(branchId),
  getLowStockAlerts: (branchId?: string) => inventoryApi.getLowStock(branchId),
};