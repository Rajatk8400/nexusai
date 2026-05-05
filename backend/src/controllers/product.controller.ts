import { Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import { sendSuccess, sendCreated } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const productController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await productService.list(req.user!.businessId!, req.query as any);
      sendSuccess(res, result);
    } catch (e) { next(e); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const p = await productService.getById(req.params["id"]!, req.user!.businessId!);
      sendSuccess(res, p);
    } catch (e) { next(e); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const p = await productService.create(req.user!.businessId!, req.body, req.user!.branchId ?? undefined);
      sendCreated(res, p, "Product created");
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const p = await productService.update(req.params["id"]!, req.user!.businessId!, req.body);
      sendSuccess(res, p, "Product updated");
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const r = await productService.delete(req.params["id"]!, req.user!.businessId!);
      sendSuccess(res, r, "Product deleted");
    } catch (e) { next(e); }
  },

  async stockValue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const r = await productService.stockValueReport(req.user!.businessId!, req.query["branchId"] as string);
      sendSuccess(res, r);
    } catch (e) { next(e); }
  },
};
