import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpense extends Document<string> {
  _id: string;
  businessId: string;
  branchId?: string;
  category: "RENT" | "SALARY" | "ELECTRICITY" | "MARKETING" | "MAINTENANCE" | "OTHER";
  amount: number;
  description?: string;
  date: Date;
  status: "PAID" | "PENDING";
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    businessId: { type: String, required: true, index: true },
    branchId: { type: String },
    category: { 
      type: String, 
      enum: ["RENT", "SALARY", "ELECTRICITY", "MARKETING", "MAINTENANCE", "OTHER"], 
      default: "OTHER" 
    },
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["PAID", "PENDING"], default: "PAID" },
  },
  { timestamps: true }
);

export const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);
