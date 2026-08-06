import mongoose, { FilterQuery } from "mongoose";
import { Inventory, InventoryMovement, Product, Branch, IInventory, IInventoryMovement, IBranch } from "../models";
import { AppError } from "../utils/AppError";
import { createLogger } from "../config/logger";

const log = createLogger("InventoryService");

export interface LowStockItem {
  productId: string;
  name: string;
  sku: string;
  quantityOnHand: number;
  quantityAvailable: number;
  reorderPoint: number;
  branchId: string;
}

export interface EnrichedStockItem {
  id: string;
  businessId: string;
  branchId: string;
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  averageCost: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  product: {
    id: string;
    name: string;
    sku: string;
    unit?: string;
    sellingPrice: number;
  };
  branch: {
    id: string;
    name: string;
    code: string;
  } | null;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export class InventoryService {
  async getLowStock(businessId: string, branchId?: string, threshold?: number): Promise<LowStockItem[]> {
    const invFilter: FilterQuery<IInventory> = { businessId };
    if (branchId) invFilter.branchId = branchId;

    const inventories = await Inventory.find(invFilter).lean();
    const productIds = inventories.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, deletedAt: null }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const lowStock: LowStockItem[] = [];

    for (const inv of inventories) {
      const product = productMap.get(inv.productId);
      if (!product) continue;

      const limit = threshold ?? inv.reorderPoint ?? 5;
      if (inv.quantityAvailable > limit) continue;

      lowStock.push({
        productId: inv.productId,
        name: product.name,
        sku: product.sku,
        quantityOnHand: inv.quantityOnHand,
        quantityAvailable: inv.quantityAvailable,
        reorderPoint: inv.reorderPoint ?? 5,
        branchId: inv.branchId,
      });
    }

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
  ): Promise<IInventory> {
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
      return inv!;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async getMovements(businessId: string, productId?: string, branchId?: string, limit = 50): Promise<IInventoryMovement[]> {
    const filter: FilterQuery<IInventoryMovement> = { businessId };
    if (productId) filter.productId = productId;
    if (branchId) filter.branchId = branchId;
    return InventoryMovement.find(filter).sort({ createdAt: -1 }).limit(limit).lean() as unknown as IInventoryMovement[];
  }

  async getStock(businessId: string, branchId?: string, productId?: string): Promise<EnrichedStockItem[]> {
    const filter: FilterQuery<IInventory> = { businessId };
    if (branchId) filter.branchId = branchId;
    if (productId) filter.productId = productId;

    const inventories = await Inventory.find(filter).lean();
    const productIds = inventories.map((i) => i.productId);
    const branchIds = inventories.map((i) => i.branchId);

    const [products, branches] = await Promise.all([
      Product.find({ _id: { $in: productIds }, deletedAt: null }).lean(),
      Branch.find({ _id: { $in: branchIds } }).lean() as unknown as IBranch[],
    ]);

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    const branchMap = new Map(branches.map((b) => [b._id.toString(), b]));

    const result: EnrichedStockItem[] = [];

    for (const inv of inventories) {
      const p = productMap.get(inv.productId);
      const b = branchMap.get(inv.branchId);
      if (!p) continue;

      result.push({
        id: inv._id.toString(),
        businessId: inv.businessId,
        branchId: inv.branchId,
        productId: inv.productId,
        quantityOnHand: inv.quantityOnHand,
        quantityReserved: inv.quantityReserved,
        quantityAvailable: inv.quantityAvailable,
        averageCost: inv.averageCost,
        reorderPoint: inv.reorderPoint,
        reorderQuantity: inv.reorderQuantity,
        product: { id: p._id.toString(), name: p.name, sku: p.sku, unit: p.unit, sellingPrice: p.sellingPrice },
        branch: b ? { id: b._id.toString(), name: b.name, code: b.code } : null,
        isLowStock: (inv.quantityAvailable ?? 0) <= (inv.reorderPoint ?? 5),
        isOutOfStock: (inv.quantityAvailable ?? 0) <= 0,
      });
    }

    return result;
  }
}

export const inventoryService = new InventoryService();
