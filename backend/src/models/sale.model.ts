import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISaleItem {
  productId: string;
  productName: string;
  sku: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountAmt: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  profitAmount: number;
}

export interface ISale extends Document<string> {
  _id: string;
  businessId: string;
  branchId: string;
  invoiceNumber: string;
  saleDateAt: Date;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerGst?: string;
  items: ISaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  profitAmount: number;
  paymentMethod: "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "CREDIT" | "MIXED";
  paymentStatus: "PENDING" | "COMPLETED" | "PARTIAL" | "REFUNDED";
  status: "DRAFT" | "CONFIRMED" | "CANCELLED" | "REFUNDED";

  notes?: string;
  ewayBill?: {
    ewayBillNumber?: string;
    transporterName?: string;
    transporterId?: string;
    vehicleNumber?: string;
    distance?: number;
    supplyType?: string;
  };
  createdById?: string;
  metadata?: object;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  hsnCode: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  discountAmt: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  profitAmount: { type: Number, default: 0 },
});

const SaleSchema = new Schema<ISale>(
  {
    businessId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true },
    saleDateAt: { type: Date, required: true, default: Date.now },
    customerId: { type: String },
    customerName: { type: String },
    customerPhone: { type: String },
    customerGst: { type: String },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    profitAmount: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["CASH", "CARD", "UPI", "BANK_TRANSFER", "CREDIT", "MIXED"],
      default: "CASH",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "PARTIAL", "REFUNDED"],
      default: "COMPLETED",
    },
    status: {
      type: String,
      enum: ["DRAFT", "CONFIRMED", "CANCELLED", "REFUNDED"],
      default: "CONFIRMED",
    },
    notes: { type: String },
    ewayBill: {
      ewayBillNumber: { type: String },
      transporterName: { type: String },
      transporterId: { type: String },
      vehicleNumber: { type: String },
      distance: { type: Number },
      supplyType: { type: String }
    },
    createdById: { type: String },
    metadata: { type: Schema.Types.Mixed },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

SaleSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });
SaleSchema.index({ businessId: 1, saleDateAt: -1 });
SaleSchema.index({ businessId: 1, status: 1 });

export const Sale: Model<ISale> = mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);
