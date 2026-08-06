import mongoose, { FilterQuery } from "mongoose";
import { Customer, CustomerTransaction, ICustomer, ICustomerTransaction, CreditScore, ICreditScore } from "../models";
import { AppError } from "../utils/AppError";

export interface CustomerQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
}

export interface CustomerListResult {
  items: ICustomer[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class CustomerService {
  async list(businessId: string, query: CustomerQuery): Promise<CustomerListResult> {
    const p = Number(query.page || 1);
    const l = Number(query.limit || 20);
    const { search } = query;
    const filter: FilterQuery<ICustomer> = { businessId, deletedAt: null };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const [items, total] = await Promise.all([
      Customer.find(filter).sort({ name: 1 }).skip((p - 1) * l).limit(l).lean() as unknown as ICustomer[],
      Customer.countDocuments(filter),
    ]);

    return { items, total, page: p, limit: l, pages: Math.ceil(total / l) };
  }

  async getById(id: string, businessId: string): Promise<ICustomer> {
    const customer = await Customer.findOne({ _id: id, businessId, deletedAt: null }).lean();
    if (!customer) throw new AppError("Customer not found", 404);
    return customer as unknown as ICustomer;
  }

  async upsert(businessId: string, data: { name: string; phone?: string; email?: string; address?: string; gstNumber?: string }): Promise<ICustomer> {
    if (data.phone) {
      const existing = await Customer.findOne({ businessId, phone: data.phone, deletedAt: null });
      if (existing) {
        const updated = await Customer.findByIdAndUpdate(existing._id, { ...data }, { new: true }).lean();
        return updated as unknown as ICustomer;
      }
    }
    const created = await Customer.create({ businessId, ...data });
    return created as unknown as ICustomer;
  }

  async recordTransaction(
    businessId: string, 
    customerId: string, 
    type: "SALE" | "PAYMENT" | "RETURN" | "ADJUSTMENT", 
    amount: number, 
    referenceId?: string, 
    notes?: string,
    paymentMethod?: string
  ): Promise<ICustomerTransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const customer = await Customer.findOne({ _id: customerId, businessId }).session(session);
      if (!customer) throw new AppError("Customer not found", 404);

      const balanceBefore = customer.balance;
      
      if (type === "SALE" || type === "ADJUSTMENT") {
         customer.balance += amount;
         customer.totalCredit += amount;
      } else if (type === "PAYMENT" || type === "RETURN") {
         customer.balance -= amount;
         customer.totalDebit += amount;
      }

      await customer.save({ session });

      const [transaction] = await CustomerTransaction.create([{
        businessId,
        customerId,
        type,
        amount,
        balanceBefore,
        balanceAfter: customer.balance,
        referenceId,
        notes,
        paymentMethod
      }], { session });

      await session.commitTransaction();
      return transaction as unknown as ICustomerTransaction;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  async getTransactions(businessId: string, customerId: string, limit = 50): Promise<ICustomerTransaction[]> {
    const txs = await CustomerTransaction.find({ businessId, customerId }).sort({ createdAt: -1 }).limit(limit).lean();
    return txs as unknown as ICustomerTransaction[];
  }

  async getTrustScore(businessId: string, customerId: string): Promise<ICreditScore | null> {
    const score = await CreditScore.findOne({ businessId, customerId }).lean();
    return score as unknown as ICreditScore | null;
  }
}

export const customerService = new CustomerService();
