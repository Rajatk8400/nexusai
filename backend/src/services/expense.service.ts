import { FilterQuery } from "mongoose";
import { Expense, IExpense } from "../models";
import { AppError } from "../utils/AppError";

export interface ExpenseQuery {
  page?: number | string;
  limit?: number | string;
  category?: string;
  from?: string;
  to?: string;
}

export interface ExpenseCategorySummary {
  _id: string;
  total: number;
}

export interface ExpenseListResult {
  items: IExpense[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class ExpenseService {
  async list(businessId: string, query: ExpenseQuery): Promise<ExpenseListResult> {
    const p = Number(query.page || 1);
    const l = Number(query.limit || 20);
    const { category, from, to } = query;
    const filter: FilterQuery<IExpense> = { businessId };
    
    if (category) filter.category = category;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip((p - 1) * l).limit(l).lean() as unknown as IExpense[],
      Expense.countDocuments(filter),
    ]);

    return { items, total, page: p, limit: l, pages: Math.ceil(total / l) };
  }

  async create(businessId: string, data: Partial<IExpense>): Promise<IExpense> {
    return await Expense.create({ businessId, ...data });
  }

  async delete(id: string, businessId: string): Promise<IExpense> {
    const result = await Expense.findOneAndDelete({ _id: id, businessId });
    if (!result) throw new AppError("Expense not found", 404);
    return result;
  }

  async getSummary(businessId: string, month: number, year: number): Promise<ExpenseCategorySummary[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const agg = await Expense.aggregate([
      { $match: { businessId, date: { $gte: start, $lte: end } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } }
    ]);

    return agg;
  }

  async getTotalMonthlyExpenses(businessId: string, month: number, year: number): Promise<number> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const result = await Expense.aggregate([
      { $match: { businessId, date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    return result[0]?.total || 0;
  }
}

export const expenseService = new ExpenseService();
