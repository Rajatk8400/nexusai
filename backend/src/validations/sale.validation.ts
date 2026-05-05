import { z } from "zod";

export const saleValidation = {
  create: z.object({
    body: z.object({
      customerId: z.string().optional(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      customerGst: z.string().optional(),
      items: z.array(
        z.object({
          productId: z.string().min(1, "Product ID is required"),
          productName: z.string().min(1, "Product name is required"),
          sku: z.string().min(1, "SKU is required"),
          quantity: z.number().min(0.001, "Quantity must be greater than 0"),
          unitPrice: z.number().min(0, "Unit price cannot be negative"),
          costPrice: z.number().min(0, "Cost price cannot be negative"),
          discountAmt: z.number().min(0).optional(),
          taxRate: z.number().min(0).max(100).optional(),
        })
      ).min(1, "At least one item is required"),
      discountAmount: z.number().min(0).optional(),
      paymentMethod: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "CREDIT"]),
      paymentStatus: z.enum(["PENDING", "COMPLETED", "PARTIAL", "REFUNDED"]),
      status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED", "REFUNDED"]),
      notes: z.string().optional(),
    }),
  }),
};
