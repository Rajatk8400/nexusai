import { Response, NextFunction } from "express";
import { reportService } from "../services/report.service";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const reportController = {
  async getGSTR1(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const month = parseInt(req.query["month"] as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query["year"] as string) || new Date().getFullYear();
      const data = await reportService.getGSTR1(req.user!.businessId!, month, year);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },
};
