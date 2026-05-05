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
      if (business.planStatus !== "PENDING_UPGRADE" && !business.lastTransactionId) {
        throw new AppError("No pending upgrade or transaction found", 400);
      }

      const planId = business.pendingPlanId || business.plan;
      let durationMonths = 0;
      if (planId === "SIX_MONTHS") durationMonths = 6;
      else if (planId === "YEARLY") durationMonths = 12;
      else if (planId === "TRIAL") durationMonths = 1;
      else throw new AppError("Invalid plan ID", 400);

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      business.plan = planId as any;
      business.planExpiresAt = expiresAt;
      business.planStatus = "ACTIVE";
      business.pendingPlanId = undefined;

      await business.save();

      sendSuccess(res, business, `Upgraded ${business.name} to ${planId} successfully`);
    } catch (e) { next(e); }
  },

  async updatePlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== "SUPER_ADMIN") {
        throw new AppError("Unauthorized", 403);
      }

      const { businessId, plan, planStatus, planExpiresAt } = req.body;
      const business = await Business.findById(businessId);
      
      if (!business) throw new AppError("Business not found", 404);

      if (plan) business.plan = plan;
      if (planStatus) business.planStatus = planStatus;
      if (planExpiresAt) business.planExpiresAt = new Date(planExpiresAt);

      await business.save();

      sendSuccess(res, business, `Updated ${business.name} plan successfully`);
    } catch (e) { next(e); }
  }
};
