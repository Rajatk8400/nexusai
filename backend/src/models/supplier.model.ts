import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupplier extends Document<string> {
  _id: string;
  businessId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: object;
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String },
    gstNumber: { type: String },
    address: { type: Schema.Types.Mixed },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const Supplier: Model<ISupplier> = mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);
