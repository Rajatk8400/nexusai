import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInventory extends Document<string> {
  _id: string;
  businessId: string;
  branchId: string;
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  averageCost: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    businessId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    quantityOnHand: { type: Number, default: 0 },
    quantityReserved: { type: Number, default: 0 },
    quantityAvailable: { type: Number, default: 0 },
    averageCost: { type: Number, default: 0 },
    reorderPoint: { type: Number },
    reorderQuantity: { type: Number },
    location: { type: String },
  },
  { timestamps: true }
);

InventorySchema.index({ businessId: 1, branchId: 1, productId: 1 }, { unique: true });

export interface IInventoryMovement extends Document<string> {
  _id: string;
  businessId: string;
  branchId: string;
  productId: string;
  type: "PURCHASE" | "SALE" | "ADJUSTMENT" | "TRANSFER_IN" | "TRANSFER_OUT" | "RETURN" | "OPENING";
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost?: number;
  totalCost?: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  performedById?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    businessId: { type: String, required: true, index: true },
    branchId: { type: String, required: true },
    productId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["PURCHASE", "SALE", "ADJUSTMENT", "TRANSFER_IN", "TRANSFER_OUT", "RETURN", "OPENING"],
      required: true,
    },
    quantity: { type: Number, required: true },
    quantityBefore: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },
    unitCost: { type: Number },
    totalCost: { type: Number },
    referenceId: { type: String },
    referenceType: { type: String },
    notes: { type: String },
    performedById: { type: String },
  },
  { timestamps: true }
);

export const Inventory: Model<IInventory> = mongoose.models.Inventory || mongoose.model<IInventory>("Inventory", InventorySchema);
export const InventoryMovement: Model<IInventoryMovement> = mongoose.models.InventoryMovement || mongoose.model<IInventoryMovement>("InventoryMovement", InventoryMovementSchema);
