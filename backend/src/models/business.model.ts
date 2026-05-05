import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBusiness extends Document<string> {
  _id: string;
  name: string;
  slug: string;
  legalName?: string;
  gstNumber?: string;
  pan?: string;
  email?: string;
  phone?: string;
  address?: object;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  currency: string;
  timezone: string;
  financialYearStart: number;
  logoUrl?: string;
  settings?: object;
  ownerId?: string;
  upiId?: string;
  plan: "TRIAL" | "SIX_MONTHS" | "YEARLY";
  planExpiresAt: Date;
  lastTransactionId?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    legalName: { type: String },
    gstNumber: { type: String, trim: true },
    pan: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: Schema.Types.Mixed },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "ACTIVE" },
    currency: { type: String, default: "INR" },
    timezone: { type: String, default: "Asia/Kolkata" },
    financialYearStart: { type: Number, default: 4 },
    logoUrl: { type: String },
    settings: { type: Schema.Types.Mixed },
    ownerId: { type: String },
    upiId: { type: String, trim: true },
    plan: { 
      type: String, 
      enum: ["TRIAL", "SIX_MONTHS", "YEARLY"], 
      default: "TRIAL" 
    },
    planExpiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    lastTransactionId: { type: String, trim: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

BusinessSchema.index({ status: 1 });

export const Business: Model<IBusiness> = mongoose.models.Business || mongoose.model<IBusiness>("Business", BusinessSchema);
