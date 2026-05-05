import { Response, NextFunction } from "express";
import { Business, User } from "../models";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../utils/AppError";

export const adminController = {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== "SUPER_ADMIN") {
        console.log("Admin Access Denied: User role is", req.user!.role);
        throw new AppError("Unauthorized", 403);
      }

      console.log("Admin Access Granted: Fetching stats...");
      const totalBusinesses = await Business.countDocuments();
      const pendingUpgrades = await Business.countDocuments({ planStatus: "PENDING_UPGRADE" });
      const activePlans = await Business.countDocuments({ planStatus: "ACTIVE" });
      const trialPlans = await Business.countDocuments({ planStatus: "TRIAL" });

      sendSuccess(res, {
        totalBusinesses,
        pendingUpgrades,
        activePlans,
        trialPlans
      }, "Admin stats fetched");
    } catch (e) { next(e); }
  },

  async getBusinesses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== "SUPER_ADMIN") {
        throw new AppError("Unauthorized", 403);
      }

      const businesses = await Business.find()
        .sort({ createdAt: -1 })
        .select("-settings"); // Exclude heavy settings object

      sendSuccess(res, businesses, "Businesses fetched");
    } catch (e) { next(e); }
  },

  async approveUpgrade(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== "SUPER_ADMIN") {
        throw new AppError("Unauthorized", 403);
      }

      const { businessId } = req.body;
      const business = await Business.findById(businessId);
      
      if (!business) throw new AppError("Business not found", 404);
      if (business.planStatus !== "PENDING_UPGRADE") {
        throw new AppError("Business is not pending an upgrade", 400);
      }

      const planId = business.pendingPlanId;
      let durationMonths = 0;
      if (planId === "SIX_MONTHS") durationMonths = 6;
      else if (planId === "YEARLY") durationMonths = 12;
      else throw new AppError("Invalid pending plan ID", 400);

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      business.plan = planId as any;
      business.planExpiresAt = expiresAt;
      business.planStatus = "ACTIVE";
      business.pendingPlanId = undefined;

      await business.save();

      sendSuccess(res, business, `Upgraded ${business.name} to ${planId} successfully`);
    } catch (e) { next(e); }
  }
};
