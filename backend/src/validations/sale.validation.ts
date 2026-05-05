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
          quantity: z.number().min(0.001, "Quantity must be greater than 0"),
          unitPrice: z.number().min(0, "Unit price cannot be negative").optional(),
          discountAmt: z.number().min(0).optional(),
        })
      ).min(1, "At least one item is required"),
      paymentMethod: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "CREDIT"]).optional(),
      isInterState: z.boolean().optional(),
      notes: z.string().optional(),
    }),
  }),
};
