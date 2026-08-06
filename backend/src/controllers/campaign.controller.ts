import { Response, NextFunction } from "express";
import { campaignService } from "../services/campaign.service";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const campaignController = {
  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await campaignService.getStats(req.user!.businessId!);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },

  async sendCampaign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await campaignService.sendCampaign(req.user!.businessId!, req.body);
      sendSuccess(res, data, "Campaign initialized");
    } catch (e) { next(e); }
  },
};
