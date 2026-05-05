import { Response, NextFunction } from "express";
import { Business } from "../models";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const businessController = {
  async upgrade(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { planId, transactionId } = req.body; // SIX_MONTHS or YEARLY
      const businessId = req.user!.businessId!;

      if (!transactionId) throw new Error("Transaction ID is required for upgrade");
      
      let durationMonths = 0;
      if (planId === "SIX_MONTHS") durationMonths = 6;
      else if (planId === "YEARLY") durationMonths = 12;
      else throw new Error("Invalid plan ID");

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      const business = await Business.findByIdAndUpdate(
        businessId,
        { 
          plan: planId, 
          planExpiresAt: expiresAt,
          lastTransactionId: transactionId,
          status: "ACTIVE" 
        },
        { new: true }
      );

      sendSuccess(res, business, `Upgraded to ${planId} successfully`);
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
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
