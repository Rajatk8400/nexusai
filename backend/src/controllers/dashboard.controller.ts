import { Response, NextFunction } from "express";
import { saleService } from "../services/sale.service";
import { inventoryService } from "../services/inventory.service";
import { productService } from "../services/product.service";
import { expenseService } from "../services/expense.service";
import { purchaseService } from "../services/purchase.service";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const dashboardController = {
  async overview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const branchId = req.query["branchId"] as string | undefined;

      const [kpis, revenueChart, lowStock, stockValue, monthExpenses, purchaseKpis] = await Promise.all([
        saleService.getDashboardKPIs(req.user!.businessId!, branchId),
        saleService.getRevenueChart(req.user!.businessId!, 7, branchId),
        inventoryService.getLowStock(req.user!.businessId!, branchId),
        productService.stockValueReport(req.user!.businessId!, branchId),
        expenseService.getTotalMonthlyExpenses(req.user!.businessId!, now.getMonth() + 1, now.getFullYear()),
        purchaseService.getPurchaseKPIs(req.user!.businessId!),
      ]);

      const netProfit = (kpis.monthProfit || 0) - monthExpenses;
      const pendingInvoices = await saleService.getPendingInvoicesCount(req.user!.businessId!);
      
      const extendedKpis = { 
        ...kpis, 
        monthExpenses, 
        netProfit, 
        ...purchaseKpis,
        pendingInvoices,
        healthScore: 0
      };
      const paymentMix = await saleService.getPaymentMix(req.user!.businessId!);

      sendSuccess(res, { kpis: extendedKpis, revenueChart, lowStock, stockValue, paymentMix });
    } catch (e) { next(e); }
  },
};
