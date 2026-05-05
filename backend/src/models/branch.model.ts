import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBranch extends Document<string> {
  _id: string;
  businessId: string;
  name: string;
  code: string;
  isHeadOffice: boolean;
  phone?: string;
  email?: string;
  address?: object;
  gstNumber?: string;
  isActive: boolean;
  managerId?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    isHeadOffice: { type: Boolean, default: false },
    phone: { type: String },
    email: { type: String },
    address: { type: Schema.Types.Mixed },
    gstNumber: { type: String },
    isActive: { type: Boolean, default: true },
    managerId: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

BranchSchema.index({ businessId: 1, code: 1 }, { unique: true });

export const Branch: Model<IBranch> = mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema);
