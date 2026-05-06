import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDocumentRecord extends Document<string> {
  _id: string;
  businessId: string;
  type: "BILL" | "INVOICE" | "AGREEMENT" | "GST" | "OTHER";
  status: "PENDING" | "EXTRACTED" | "SENT_TO_CA" | "FAILED";
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  extractedData?: {
    vendorName?: string;
    date?: Date;
    invoiceNumber?: string;
    totalAmount?: number;
    taxAmount?: number;
    gstin?: string;
    rawText?: string;
  };
  sentToCaAt?: Date;
  notes?: string;
  metadata?: object;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentRecordSchema = new Schema<IDocumentRecord>(
  {
    businessId: { type: String, required: true, index: true },
    type: { 
      type: String, 
      enum: ["BILL", "INVOICE", "AGREEMENT", "GST", "OTHER"], 
      default: "BILL" 
    },
    status: { 
      type: String, 
      enum: ["PENDING", "EXTRACTED", "SENT_TO_CA", "FAILED"], 
      default: "PENDING" 
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String },
    fileSize: { type: Number },
    extractedData: {
      vendorName: { type: String },
      date: { type: Date },
      invoiceNumber: { type: String },
      totalAmount: { type: Number },
      taxAmount: { type: Number },
      gstin: { type: String },
      rawText: { type: String },
    },
    sentToCaAt: { type: Date },
    notes: { type: String },
    metadata: { type: Schema.Types.Mixed },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

DocumentRecordSchema.index({ businessId: 1, type: 1 });
DocumentRecordSchema.index({ businessId: 1, status: 1 });

export const DocumentRecord: Model<IDocumentRecord> = mongoose.models.DocumentRecord || mongoose.model<IDocumentRecord>("DocumentRecord", DocumentRecordSchema);
