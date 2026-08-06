import { Response, NextFunction } from "express";
import { aiService } from "../services/ai.service";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const aiController = {
  async getDemandForecast(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const days = req.query.days ? Number(req.query.days) : 30;
      const forecast = await aiService.generateDemandForecast(req.user!.businessId!, productId!, days);
      sendSuccess(res, forecast);
    } catch (e) { next(e); }
  },

  async getRevenueForecast(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.query.days ? Number(req.query.days) : 30;
      const forecast = await aiService.generateRevenueForecast(req.user!.businessId!, days);
      sendSuccess(res, forecast);
    } catch (e) { next(e); }
  },

  async getInventoryInsights(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const insights = await aiService.getInventoryInsights(req.user!.businessId!, req.user!.branchId ?? undefined);
      sendSuccess(res, insights);
    } catch (e) { next(e); }
  },

  async getStaffProductivity(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await aiService.getStaffProductivity(req.user!.businessId!);
      sendSuccess(res, stats);
    } catch (e) { next(e); }
  },

  async getBusinessInsights(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const insights = await aiService.getBusinessInsights(req.user!.businessId!);
      sendSuccess(res, insights);
    } catch (e) { next(e); }
  },
};
