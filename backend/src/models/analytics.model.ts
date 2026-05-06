import mongoose, { Schema, Document, Model } from "mongoose";

export interface IForecastResult extends Document<string> {
  _id: string;
  businessId: string;
  productId?: string;
  type: "DEMAND" | "REVENUE" | "INVENTORY" | "STAFF" | "INSIGHTS";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  modelVersion?: string;
  forecastPeriod: number;
  forecastStartAt: Date;
  forecastEndAt: Date;
  predictions: object[];
  accuracy?: number;
  confidenceScore?: number;
  inputFeatures?: object;
  hyperparameters?: object;
  errorMessage?: string;
  processedAt?: Date;
  expiresAt?: Date;
  metadata?: object;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ForecastResultSchema = new Schema<IForecastResult>(
  {
    businessId: { type: String, required: true, index: true },
    productId: { type: String, index: true },
    type: { type: String, enum: ["DEMAND", "REVENUE", "INVENTORY", "STAFF", "INSIGHTS"], default: "DEMAND" },
    status: { type: String, enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"], default: "PENDING" },
    modelVersion: { type: String },
    forecastPeriod: { type: Number, required: true },
    forecastStartAt: { type: Date, required: true },
    forecastEndAt: { type: Date, required: true },
    predictions: { type: [Schema.Types.Mixed], default: [] },
    accuracy: { type: Number },
    confidenceScore: { type: Number },
    inputFeatures: { type: Schema.Types.Mixed },
    hyperparameters: { type: Schema.Types.Mixed },
    errorMessage: { type: String },
    processedAt: { type: Date },
    expiresAt: { type: Date, index: true },
    metadata: { type: Schema.Types.Mixed },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export interface IAuditLog extends Document<string> {
  _id: string;
  businessId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
  oldValues?: object;
  newValues?: object;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    businessId: { type: String, required: true, index: true },
    userId: { type: String },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    description: { type: String },
    oldValues: { type: Schema.Types.Mixed },
    newValues: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ForecastResult: Model<IForecastResult> = mongoose.models.ForecastResult || mongoose.model<IForecastResult>("ForecastResult", ForecastResultSchema);
export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
