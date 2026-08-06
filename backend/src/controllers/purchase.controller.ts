import { Response, NextFunction } from "express";
import { purchaseService, PurchaseQuery } from "../services/purchase.service";
import { sendSuccess, sendCreated } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const purchaseController = {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await purchaseService.list(req.user!.businessId!, req.query as PurchaseQuery);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await purchaseService.create(
        req.user!.businessId!,
        req.user!.branchId || "main",
        req.user!.id!,
        req.body
      );
      sendCreated(res, data, "Purchase recorded and inventory updated");
    } catch (e) { next(e); }
  },
};
