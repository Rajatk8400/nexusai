import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document<string> {
  _id: string;
  businessId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  avatarUrl?: string;
  totalCredit: number; // Amount customer owes to business
  totalDebit: number;  // Amount business owes to customer (rare)
  balance: number;     // net balance
  creditLimit: number;
  riskStatus: "CLEAR" | "PENDING" | "OVERDUE" | "HIGH_RISK";
  lastTransactionAt?: Date;
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },
    gstNumber: { type: String, trim: true },
    avatarUrl: { type: String },
    totalCredit: { type: Number, default: 0 },
    totalDebit: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 0 },
    riskStatus: { 
      type: String, 
      enum: ["CLEAR", "PENDING", "OVERDUE", "HIGH_RISK"], 
      default: "CLEAR" 
    },
    lastTransactionAt: { type: Date },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

CustomerSchema.index({ businessId: 1, phone: 1 });

export interface ICustomerTransaction extends Document<string> {
  _id: string;
  businessId: string;
  customerId: string;
  type: "SALE" | "PAYMENT" | "RETURN" | "ADJUSTMENT" | "UDHAR";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMode?: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
  referenceId?: string; // e.g. Sale ID
  notes?: string;
  attachments?: string[];
  createdAt: Date;
}

const CustomerTransactionSchema = new Schema<ICustomerTransaction>(
  {
    businessId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    type: { 
      type: String, 
      enum: ["SALE", "PAYMENT", "RETURN", "ADJUSTMENT", "UDHAR"], 
      required: true 
    },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    paymentMode: { 
      type: String, 
      enum: ["CASH", "UPI", "CARD", "BANK_TRANSFER"],
      default: "CASH" 
    },
    referenceId: { type: String },
    notes: { type: String },
    attachments: [{ type: String }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
export const CustomerTransaction: Model<ICustomerTransaction> = mongoose.models.CustomerTransaction || mongoose.model<ICustomerTransaction>("CustomerTransaction", CustomerTransactionSchema);
