import { z } from "zod";

export const productValidation = {
  create: z.object({
    body: z.object({
      name: z.string().min(1, "Product name is required"),
      sku: z.string().min(1, "SKU is required"),
      barcode: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      unit: z.string().optional(),
      costPrice: z.number().min(0, "Cost price must be positive"),
      sellingPrice: z.number().min(0, "Selling price must be positive"),
      mrp: z.number().optional(),
      taxRate: z.number().min(0).max(100).optional(),
      hsnCode: z.string().optional(),
      status: z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED"]).optional(),
      imageUrl: z.string().url().optional().or(z.literal('')),
      // Inventory fields
      openingStock: z.number().min(0).optional(),
      reorderPoint: z.number().min(0).optional(),
      reorderQuantity: z.number().min(0).optional(),
      location: z.string().optional(),
    }),
  }),
  update: z.object({
    body: z.object({
      name: z.string().min(1, "Product name is required").optional(),
      sku: z.string().min(1, "SKU is required").optional(),
      barcode: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      unit: z.string().optional(),
      costPrice: z.number().min(0, "Cost price must be positive").optional(),
      sellingPrice: z.number().min(0, "Selling price must be positive").optional(),
      mrp: z.number().optional(),
      taxRate: z.number().min(0).max(100).optional(),
      hsnCode: z.string().optional(),
      status: z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED"]).optional(),
      imageUrl: z.string().url().optional().or(z.literal('')),
    }),
    params: z.object({
      id: z.string(),
    }),
  }),
};
