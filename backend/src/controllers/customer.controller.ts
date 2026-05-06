import { Response, NextFunction } from "express";
import { customerService } from "../services/customer.service";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const customerController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await customerService.list(req.user!.businessId!, req.query);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await customerService.getById(req.params["id"]!, req.user!.businessId!);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },

  async recordTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, amount, referenceId, notes, paymentMethod } = req.body;
      const data = await customerService.recordTransaction(
        req.user!.businessId!,
        req.params["id"]!,
        type,
        amount,
        referenceId,
        notes,
        paymentMethod
      );
      sendSuccess(res, data, "Transaction recorded");
    } catch (e) { next(e); }
  },

  async getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await customerService.getTransactions(req.user!.businessId!, req.params["id"]!);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },
  
  async getTrustScore(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await customerService.getTrustScore(req.user!.businessId!, req.params["id"]!);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },
};
