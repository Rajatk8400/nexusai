import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document<string> {
  _id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "SUPER_ADMIN" | "BUSINESS_OWNER" | "BRANCH_MANAGER" | "STAFF" | "ANALYST" | "VIEWER";
  roleLevel: number;
  businessId?: string;
  branchId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  refreshToken?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "BUSINESS_OWNER", "BRANCH_MANAGER", "STAFF", "ANALYST", "VIEWER"],
      default: "STAFF",
    },
    roleLevel: { type: Number, default: 40 },
    businessId: { type: String, index: true },
    branchId: { type: String, index: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    refreshToken: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
