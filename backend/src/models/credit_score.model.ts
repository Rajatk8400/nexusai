import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICreditScore extends Document<string> {
  _id: string;
  businessId: string;
  customerId: string;
  score: number; // 300 - 900
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  insights: string[];
  factors: {
    paymentPunctuality: number;
    transactionFrequency: number;
    avgTicketSize: number;
    outstandingRatio: number;
  };
  lastCalculatedAt: Date;
}

const CreditScoreSchema = new Schema<ICreditScore>(
  {
    businessId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    score: { type: Number, default: 700 },
    riskLevel: { 
      type: String, 
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], 
      default: "LOW" 
    },
    insights: [{ type: String }],
    factors: {
      paymentPunctuality: { type: Number, default: 0 },
      transactionFrequency: { type: Number, default: 0 },
      avgTicketSize: { type: Number, default: 0 },
      outstandingRatio: { type: Number, default: 0 },
    },
    lastCalculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CreditScore: Model<ICreditScore> = mongoose.models.CreditScore || mongoose.model<ICreditScore>("CreditScore", CreditScoreSchema);
