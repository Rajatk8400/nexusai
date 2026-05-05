import { Response, NextFunction } from "express";
import { Business } from "../models";
import { AuthRequest } from "./auth.middleware";
import { AppError } from "../utils/AppError";

export async function checkSubscription(req: AuthRequest, res: Response, next: NextFunction) {
  // Super admins or users without business (shouldn't happen for core features) skip this
  if (req.user?.role === "SUPER_ADMIN" || !req.user?.businessId) {
    return next();
  }

  try {
    const business = await Business.findById(req.user.businessId).select("plan planExpiresAt status");
    
    if (!business) {
      return next(new AppError("Business not found", 404));
    }

    if (business.status !== "ACTIVE") {
      return next(new AppError(`Your business account is ${business.status.toLowerCase()}`, 403));
    }

    const now = new Date();
    const expiresAt = business.planExpiresAt ? new Date(business.planExpiresAt) : null;

    if (!expiresAt || expiresAt < now) {
      return next(new AppError("SUBSCRIPTION_EXPIRED", 402)); // Use 402 Payment Required
    }

    next();
  } catch (e) {
    next(e);
  }
}
