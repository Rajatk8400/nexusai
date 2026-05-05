import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document<string> {
  _id: string;
  businessId: string;
  supplierId?: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  taxRate: number;
  hsnCode?: string;
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  imageUrl?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    businessId: { type: String, required: true, index: true },
    supplierId: { type: String },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String },
    description: { type: String },
    category: { type: String },
    unit: { type: String, default: "unit" },
    costPrice: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: true, default: 0 },
    mrp: { type: Number },
    taxRate: { type: Number, default: 18 },
    hsnCode: { type: String },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "DISCONTINUED"], default: "ACTIVE" },
    imageUrl: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

ProductSchema.index({ businessId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ businessId: 1, status: 1 });
ProductSchema.index({ barcode: 1 });

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
