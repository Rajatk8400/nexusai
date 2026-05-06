import { DocumentRecord, IDocumentRecord } from "../models";
import { AppError } from "../utils/AppError";
import { createLogger } from "../config/logger";

const log = createLogger("DocumentService");

export class DocumentService {
  async listDocuments(businessId: string, type?: string): Promise<any[]> {
    const filter: any = { businessId, deletedAt: null };
    if (type) filter.type = type;
    return DocumentRecord.find(filter).sort({ createdAt: -1 }).lean();
  }

  async getDocument(businessId: string, documentId: string) {
    const doc = await DocumentRecord.findOne({ _id: documentId, businessId, deletedAt: null });
    if (!doc) throw new AppError("Document not found", 404);
    return doc;
  }

  async processDocument(businessId: string, file: Express.Multer.File, type: string) {
    // 1. Create initial record
    const doc = await DocumentRecord.create({
      businessId,
      type,
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`, // Assuming a static uploads folder
      fileType: file.mimetype,
      fileSize: file.size,
      status: "PENDING"
    });

    // 2. Simulate AI Data Extraction
    // In a real app, this would call an OCR API
    setTimeout(() => this.runAiExtraction(doc._id), 2000);

    return doc;
  }

  private async runAiExtraction(docId: string) {
    try {
      const doc = await DocumentRecord.findById(docId);
      if (!doc) return;

      log.info("Running AI Extraction for document", { docId });

      // Simulate extraction logic
      const mockData = {
        vendorName: "Amazon Web Services",
        date: new Date(),
        invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
        totalAmount: Math.floor(Math.random() * 5000) + 500,
        taxAmount: Math.floor(Math.random() * 500) + 50,
        gstin: "27AADCA1234F1Z5",
        rawText: "Sample extracted text from the document image..."
      };

      doc.extractedData = mockData;
      doc.status = "EXTRACTED";
      await doc.save();

      log.info("AI Extraction completed", { docId });
    } catch (e: any) {
      log.error("AI Extraction failed", { error: e.message, docId });
      await DocumentRecord.findByIdAndUpdate(docId, { status: "FAILED" });
    }
  }

  async sendToCa(businessId: string, documentIds: string[]) {
    const result = await DocumentRecord.updateMany(
      { _id: { $in: documentIds }, businessId },
      { $set: { status: "SENT_TO_CA", sentToCaAt: new Date() } }
    );
    return result;
  }

  async deleteDocument(businessId: string, documentId: string) {
    const result = await DocumentRecord.updateOne(
      { _id: documentId, businessId },
      { $set: { deletedAt: new Date() } }
    );
    return result;
  }
}

export const documentService = new DocumentService();
