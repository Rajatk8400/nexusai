import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPurchase extends Document<string> {
  _id: string;
  businessId: string;
  branchId: string;
  supplierId: string;
  purchaseNumber: string;
  purchaseDateAt: Date;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
  }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: "PAID" | "PENDING" | "PARTIAL";
  notes?: string;
  createdById: string;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    businessId: { type: String, required: true, index: true },
    branchId: { type: String, required: true },
    supplierId: { type: String, required: true },
    purchaseNumber: { type: String, required: true },
    purchaseDateAt: { type: Date, default: Date.now },
    items: [{
      productId: { type: String, required: true },
      productName: { type: String, required: true },
      quantity: { type: Number, required: true },
      unitCost: { type: Number, required: true },
      taxRate: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
    }],
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["PAID", "PENDING", "PARTIAL"], default: "PAID" },
    notes: { type: String },
    createdById: { type: String, required: true },
  },
  { timestamps: true }
);

export const Purchase: Model<IPurchase> = mongoose.models.Purchase || mongoose.model<IPurchase>("Purchase", PurchaseSchema);
