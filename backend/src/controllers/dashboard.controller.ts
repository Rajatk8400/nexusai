import { Response, NextFunction } from "express";
import { saleService } from "../services/sale.service";
import { inventoryService } from "../services/inventory.service";
import { productService } from "../services/product.service";
import { expenseService } from "../services/expense.service";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const dashboardController = {
  async overview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const [kpis, revenueChart, lowStock, stockValue, monthExpenses] = await Promise.all([
        saleService.getDashboardKPIs(req.user!.businessId!, req.query["branchId"] as string),
        saleService.getRevenueChart(req.user!.businessId!, 7, req.query["branchId"] as string),
        inventoryService.getLowStock(req.user!.businessId!, req.query["branchId"] as string),
        productService.stockValueReport(req.user!.businessId!, req.query["branchId"] as string),
        expenseService.getTotalMonthlyExpenses(req.user!.businessId!, now.getMonth() + 1, now.getFullYear()),
      ]);

      const netProfit = (kpis.monthProfit || 0) - monthExpenses;
      const extendedKpis = { ...kpis, monthExpenses, netProfit };

      sendSuccess(res, { kpis: extendedKpis, revenueChart, lowStock, stockValue });
    } catch (e) { next(e); }
  },
};
