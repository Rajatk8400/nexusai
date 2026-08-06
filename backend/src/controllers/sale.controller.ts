import { Response, NextFunction } from "express";
import { saleService, SaleQuery } from "../services/sale.service";
import { sendSuccess, sendCreated } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const saleController = {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sale = await saleService.create(
        req.user!.businessId!,
        req.user!.branchId!,
        req.user!.id,
        req.body
      );
      sendCreated(res, sale, "Sale created");
    } catch (e) { next(e); }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await saleService.list(req.user!.businessId!, req.query as SaleQuery);
      sendSuccess(res, result);
    } catch (e) { next(e); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sale = await saleService.getById(req.params["id"]!, req.user!.businessId!);
      sendSuccess(res, sale);
    } catch (e) { next(e); }
  },

  async revenueChart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = parseInt((req.query["months"] as string) ?? "7", 10);
      const data = await saleService.getRevenueChart(req.user!.businessId!, months, req.query["branchId"] as string);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },

  async dashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const kpis = await saleService.getDashboardKPIs(req.user!.businessId!, req.query["branchId"] as string);
      sendSuccess(res, kpis);
    } catch (e) { next(e); }
  },
  
  async updateEwayBill(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sale = await saleService.updateEwayBill(
        req.user!.businessId!,
        req.params["id"]!,
        req.body
      );
      sendSuccess(res, sale, "E-Way Bill details updated");
    } catch (e) { next(e); }
  }
};
