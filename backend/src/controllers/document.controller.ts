import { Response, NextFunction } from "express";
import { documentService } from "../services/document.service";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../utils/AppError";

export const documentController = {
  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError("No file uploaded", 400);
      const { type } = req.body;
      const doc = await documentService.processDocument(req.user!.businessId!, req.file, type || "BILL");
      sendSuccess(res, doc, 201);
    } catch (e) { next(e); }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type } = req.query;
      const docs = await documentService.listDocuments(req.user!.businessId!, type as string);
      sendSuccess(res, docs);
    } catch (e) { next(e); }
  },

  async sendToCa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { documentIds } = req.body;
      if (!Array.isArray(documentIds)) throw new AppError("documentIds must be an array", 400);
      const result = await documentService.sendToCa(req.user!.businessId!, documentIds);
      sendSuccess(res, result);
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await documentService.deleteDocument(req.user!.businessId!, id);
      sendSuccess(res, { success: true });
    } catch (e) { next(e); }
  }
};
