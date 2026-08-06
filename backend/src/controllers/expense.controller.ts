import { Response, NextFunction } from "express";
import { expenseService, ExpenseQuery } from "../services/expense.service";
import { sendSuccess, sendCreated } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const expenseController = {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await expenseService.list(req.user!.businessId!, req.query as ExpenseQuery);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await expenseService.create(req.user!.businessId!, req.body);
      sendCreated(res, data, "Expense recorded");
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await expenseService.delete(req.params["id"]!, req.user!.businessId!);
      sendSuccess(res, null, "Expense deleted");
    } catch (e) { next(e); }
  },
};
