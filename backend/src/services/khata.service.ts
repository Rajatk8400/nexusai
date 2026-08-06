import { Customer, CustomerTransaction, CreditScore, ICustomer, ICustomerTransaction } from "../models";
import { AppError } from "../utils/AppError";
import { createLogger } from "../config/logger";

const log = createLogger("KhataService");

export interface RecordKhataTransactionInput {
  type: "SALE" | "UDHAR" | "PAYMENT" | "RETURN" | "ADJUSTMENT";
  amount: number;
  notes?: string;
  referenceId?: string;
  paymentMethod?: string;
}

export interface KhataTransactionResult {
  transaction: ICustomerTransaction;
  customer: ICustomer;
}

export class KhataService {
  async recordTransaction(
    businessId: string, 
    customerId: string, 
    data: RecordKhataTransactionInput
  ): Promise<KhataTransactionResult> {
    const customer = await Customer.findOne({ _id: customerId, businessId, deletedAt: null });
    if (!customer) throw new AppError("Customer not found", 404);

    const balanceBefore = customer.balance;
    let balanceAfter = balanceBefore;

    if (data.type === "SALE" || data.type === "UDHAR") {
      balanceAfter += data.amount;
      customer.totalCredit += data.amount;
    } else if (data.type === "PAYMENT" || data.type === "RETURN") {
      balanceAfter -= data.amount;
      customer.totalDebit += data.amount;
    } else if (data.type === "ADJUSTMENT") {
      balanceAfter = data.amount;
    }

    const transaction = await CustomerTransaction.create({
      businessId,
      customerId,
      ...data,
      balanceBefore,
      balanceAfter,
    });

    customer.balance = balanceAfter;
    customer.lastTransactionAt = new Date();
    
    if (customer.balance <= 0) {
      customer.riskStatus = "CLEAR";
    } else if (customer.balance > customer.creditLimit && customer.creditLimit > 0) {
      customer.riskStatus = "HIGH_RISK";
    } else {
      customer.riskStatus = "PENDING";
    }

    await customer.save();
    
    this.calculateTrustScore(businessId, customerId).catch((err) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      log.error("Score calculation failed", { error: errMsg });
    });

    return { transaction, customer };
  }

  async calculateTrustScore(businessId: string, customerId: string): Promise<void> {
    const transactions = await CustomerTransaction.find({ businessId, customerId }).sort({ createdAt: -1 }).limit(50).lean();
    const customer = await Customer.findById(customerId);
    if (!customer) return;

    let score = 700;
    const insights: string[] = [];

    const payments = transactions.filter((t) => t.type === "PAYMENT");
    const sales = transactions.filter((t) => t.type === "SALE" || t.type === "UDHAR");

    if (payments.length > 0) {
      score += 50;
      insights.push("Regular payment history detected.");
    }

    if (customer.creditLimit > 0) {
      const ratio = customer.balance / customer.creditLimit;
      if (ratio > 0.8) {
         score -= 100;
         insights.push("High credit utilization (>80%). Avoid further credit.");
      } else if (ratio < 0.3) {
         score += 30;
         insights.push("Healthy credit utilization.");
      }
    }

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    if (score < 400) riskLevel = "CRITICAL";
    else if (score < 600) riskLevel = "HIGH";
    else if (score < 750) riskLevel = "MEDIUM";

    await CreditScore.findOneAndUpdate(
      { businessId, customerId },
      { 
        score, 
        riskLevel, 
        insights, 
        lastCalculatedAt: new Date(),
        factors: {
          paymentPunctuality: payments.length / Math.max(sales.length, 1),
          transactionFrequency: transactions.length / 30,
          avgTicketSize: sales.reduce((acc, s) => acc + s.amount, 0) / Math.max(sales.length, 1),
          outstandingRatio: customer.creditLimit > 0 ? customer.balance / customer.creditLimit : 0
        }
      },
      { upsert: true, new: true }
    );

    log.info("Trust score updated for customer", { customerId, score });
  }

  async generateReminderTemplate(businessId: string, customerId: string, type: "FRIENDLY" | "URGENT"): Promise<string> {
    const customer = await Customer.findById(customerId);
    if (!customer) throw new AppError("Customer not found", 404);

    const balance = customer.balance.toLocaleString("en-IN");
    
    if (type === "FRIENDLY") {
      return `Hi ${customer.name}, just a gentle reminder from NexusAI regarding your pending balance of ₹${balance}. Hope you have a great day!`;
    } else {
      return `IMPORTANT: Hi ${customer.name}, your payment of ₹${balance} is now overdue. Please settle this at your earliest convenience to avoid credit limit restrictions. - NexusAI Team`;
    }
  }
}

export const khataService = new KhataService();
