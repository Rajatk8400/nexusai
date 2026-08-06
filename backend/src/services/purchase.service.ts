import mongoose from "mongoose";
import { Purchase, Product, Inventory, InventoryMovement, IPurchase, IPurchaseItem } from "../models";
import { AppError } from "../utils/AppError";

export interface PurchaseItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
  taxRate?: number;
}

export interface CreatePurchaseInput {
  supplierId: string;
  purchaseNumber: string;
  purchaseDateAt?: Date;
  items: PurchaseItemInput[];
  notes?: string;
}

export interface PurchaseQuery {
  page?: number | string;
  limit?: number | string;
}

export interface PurchaseListResult {
  items: IPurchase[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class PurchaseService {
  async create(
    businessId: string,
    branchId: string,
    createdById: string,
    data: CreatePurchaseInput
  ): Promise<IPurchase> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const productIds = data.items.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds }, businessId }).session(session);
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      let subtotal = 0;
      let totalTax = 0;
      const purchaseItems: IPurchaseItem[] = [];

      for (const item of data.items) {
        const product = productMap.get(item.productId);
        if (!product) throw new AppError(`Product ${item.productId} not found`, 404);

        const taxRate = item.taxRate ?? product.taxRate;
        const lineSubtotal = item.unitCost * item.quantity;
        const lineTax = (lineSubtotal * taxRate) / 100;
        const lineTotal = lineSubtotal + lineTax;

        subtotal += lineSubtotal;
        totalTax += lineTax;

        purchaseItems.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitCost: item.unitCost,
          taxRate,
          taxAmount: lineTax,
          totalAmount: lineTotal,
        });

        let inv = await Inventory.findOne({ businessId, branchId, productId: item.productId }).session(session);
        if (!inv) {
          inv = new Inventory({
            businessId, branchId, productId: item.productId,
            quantityOnHand: 0, quantityAvailable: 0, averageCost: 0
          });
        }

        const totalQtyBefore = inv.quantityOnHand;
        const totalCostBefore = totalQtyBefore * inv.averageCost;
        const newStockCost = item.unitCost * item.quantity;
        
        inv.quantityOnHand += item.quantity;
        inv.quantityAvailable += item.quantity;
        inv.averageCost = (totalCostBefore + newStockCost) / inv.quantityOnHand;

        await inv.save({ session });

        product.costPrice = item.unitCost;
        await product.save({ session });

        await InventoryMovement.create([{
          businessId, branchId,
          productId: item.productId,
          type: "PURCHASE",
          quantity: item.quantity,
          quantityBefore: totalQtyBefore,
          quantityAfter: inv.quantityOnHand,
          unitCost: item.unitCost,
          totalCost: newStockCost,
          performedById: createdById,
        }], { session });
      }

      const [purchase] = await Purchase.create([{
        businessId, branchId,
        supplierId: data.supplierId,
        purchaseNumber: data.purchaseNumber,
        purchaseDateAt: data.purchaseDateAt ?? new Date(),
        items: purchaseItems,
        subtotal,
        taxAmount: totalTax,
        totalAmount: subtotal + totalTax,
        paymentStatus: "PAID",
        notes: data.notes,
        createdById,
      }], { session });

      await session.commitTransaction();
      return purchase;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  async list(businessId: string, query: PurchaseQuery): Promise<PurchaseListResult> {
    const p = Number(query.page || 1);
    const l = Number(query.limit || 20);
    const [items, total] = await Promise.all([
      Purchase.find({ businessId }).sort({ purchaseDateAt: -1 }).skip((p - 1) * l).limit(l).lean() as unknown as IPurchase[],
      Purchase.countDocuments({ businessId }),
    ]);
    return { items, total, page: p, limit: l, pages: Math.ceil(total / l) };
  }

  async getPurchaseKPIs(businessId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [thisMonth] = await Purchase.aggregate([
      { $match: { businessId, purchaseDateAt: { $gte: startOfMonth } } },
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" }, totalTax: { $sum: "$taxAmount" } } },
    ]);

    return {
      totalPurchases: thisMonth?.totalAmount || 0,
      totalITC: thisMonth?.totalTax || 0,
    };
  }
}

export const purchaseService = new PurchaseService();
