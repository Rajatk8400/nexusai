import { Response, NextFunction } from "express";
import { inventoryService } from "../services/inventory.service";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const inventoryController = {
  async getLowStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await inventoryService.getLowStock(
        req.user!.businessId!,
        req.query["branchId"] as string,
        req.query["threshold"] ? Number(req.query["threshold"]) : undefined
      );
      sendSuccess(res, items);
    } catch (e) { next(e); }
  },

  async adjust(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, quantity, type, notes, unitCost } = req.body;
      const inv = await inventoryService.adjust(
        req.user!.businessId!,
        req.user!.branchId!,
        productId,
        quantity,
        type ?? "ADJUSTMENT",
        notes,
        req.user!.id,
        unitCost
      );
      sendSuccess(res, inv, "Stock adjusted");
    } catch (e) { next(e); }
  },

  async getMovements(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const movements = await inventoryService.getMovements(
        req.user!.businessId!,
        req.query["productId"] as string,
        req.query["branchId"] as string,
        Number(req.query["limit"] ?? 50)
      );
      sendSuccess(res, movements);
    } catch (e) { next(e); }
  },

  async getStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stock = await inventoryService.getStock(
        req.user!.businessId!,
        req.query["branchId"] as string,
        req.query["productId"] as string
      );
      sendSuccess(res, stock);
    } catch (e) { next(e); }
  },
};
