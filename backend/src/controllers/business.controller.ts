import { Response, NextFunction } from "express";
import { Business } from "../models";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../utils/AppError";

export const businessController = {
  async upgrade(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId, transactionId } = req.body;
      const businessId = req.user!.businessId!;

      if (!transactionId) throw new AppError("Transaction ID is required for upgrade", 400);

      const business = await Business.findByIdAndUpdate(
        businessId,
        { 
          planStatus: "PENDING_UPGRADE",
          pendingPlanId: planId,
          lastTransactionId: transactionId,
        },
        { new: true }
      );

      sendSuccess(res, business, `Upgraded to ${planId} successfully`);
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId!;
      const { name, upiId, legalName, gstNumber, pan, email, phone, address, settings } = req.body;

      const business = await Business.findByIdAndUpdate(
        businessId,
        { name, upiId, legalName, gstNumber, pan, email, phone, address, settings },
        { new: true }
      );

      sendSuccess(res, business, "Business settings updated");
    } catch (e) { next(e); }
  },
};
