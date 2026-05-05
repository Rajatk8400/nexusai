import mongoose from "mongoose";
import { Inventory, InventoryMovement, Product } from "../models";
import { AppError } from "../utils/AppError";
import { createLogger } from "../config/logger";

const log = createLogger("InventoryService");

export class InventoryService {
  async getLowStock(businessId: string, branchId?: string, threshold?: number) {
    const invFilter: any = { businessId };
    if (branchId) invFilter.branchId = branchId;

    const inventories = await Inventory.find(invFilter).lean();
    const productIds = inventories.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, deletedAt: null }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const lowStock = inventories
      .map((inv) => {
        const product = productMap.get(inv.productId);
        if (!product) return null; // Skip if product is deleted

        const limit = threshold ?? inv.reorderPoint ?? 5;
        if (inv.quantityAvailable > limit) return null; // Not low stock

        return {
          productId: inv.productId,
          name: product.name,
          sku: product.sku,
          quantityOnHand: inv.quantityOnHand,
          quantityAvailable: inv.quantityAvailable,
          reorderPoint: inv.reorderPoint ?? 5,
          branchId: inv.branchId,
        };
      })
      .filter((item) => item !== null);

    return lowStock;
  }

  async adjust(
    businessId: string,
    branchId: string,
    productId: string,
    quantity: number,
    type: "ADJUSTMENT" | "PURCHASE" | "OPENING",
    notes?: string,
    performedById?: string,
    unitCost?: number
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let inv = await Inventory.findOne({ businessId, branchId, productId }).session(session);
      if (!inv) {
        inv = await Inventory.create([{
          businessId, branchId, productId,
          quantityOnHand: 0, quantityReserved: 0, quantityAvailable: 0,
          averageCost: unitCost ?? 0,
        }], { session }).then((r) => r[0]);
      }

      const before = inv!.quantityOnHand;
      const newQty = before + quantity;
      if (newQty < 0) throw new AppError("Stock cannot go below zero", 400);

      // Update weighted average cost on purchase
      if (unitCost && quantity > 0) {
        const totalCost = before * inv!.averageCost + quantity * unitCost;
        inv!.averageCost = newQty > 0 ? totalCost / newQty : unitCost;
      }

      inv!.quantityOnHand = newQty;
      inv!.quantityAvailable = newQty - inv!.quantityReserved;
      await inv!.save({ session });

      await InventoryMovement.create([{
        businessId, branchId, productId, type,
        quantity,
        quantityBefore: before,
        quantityAfter: newQty,
        unitCost,
        totalCost: unitCost ? unitCost * Math.abs(quantity) : undefined,
        notes,
        performedById,
      }], { session });

      await session.commitTransaction();
      log.info("Inventory adjusted", { productId, quantity, type });
      return inv;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async getMovements(businessId: string, productId?: string, branchId?: string, limit = 50): Promise<any> {
    const filter: any = { businessId };
    if (productId) filter.productId = productId;
    if (branchId) filter.branchId = branchId;
    return InventoryMovement.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  }

  async getStock(businessId: string, branchId?: string, productId?: string): Promise<any> {
    const filter: any = { businessId };
    if (branchId) filter.branchId = branchId;
    if (productId) filter.productId = productId;

    const inventories = await Inventory.find(filter).lean();
    const productIds = inventories.map((i) => i.productId);
    const branchIds = inventories.map((i) => i.branchId);

    const [products, branches] = await Promise.all([
      Product.find({ _id: { $in: productIds }, deletedAt: null }).lean(),
      mongoose.model("Branch").find({ _id: { $in: branchIds } }).lean(),
    ]);

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    const branchMap = new Map(branches.map((b: any) => [b._id.toString(), b]));

    return inventories
      .map((inv) => {
        const p = productMap.get(inv.productId);
        const b = branchMap.get(inv.branchId);
        if (!p) return null; // Skip if product is deleted
        return {
          ...inv,
          id: inv._id.toString(),
          product: { id: p._id.toString(), name: p.name, sku: p.sku, unit: p.unit, sellingPrice: p.sellingPrice },
          branch: b ? { id: b._id.toString(), name: b.name, code: b.code } : null,
          isLowStock: (inv.quantityAvailable ?? 0) <= (inv.reorderPoint ?? 5),
          isOutOfStock: (inv.quantityAvailable ?? 0) <= 0,
        };
      })
      .filter((item) => item !== null);
  }
}

export const inventoryService = new InventoryService();
