import { PipelineStage, FilterQuery } from "mongoose";
import { Product, Inventory, IProduct, IInventory } from "../models";
import { AppError } from "../utils/AppError";
import { createLogger } from "../config/logger";

const log = createLogger("ProductService");

export interface ProductQuery {
  status?: string;
  category?: string;
  search?: string;
  page?: number | string;
  limit?: number | string;
}

export interface CreateProductInput extends Partial<IProduct> {
  initialStock?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
}

export interface StockValueItem {
  productId: string;
  name: string;
  sku: string;
  quantityOnHand: number;
  averageCost: number;
  sellingPrice: number;
  stockValue: number;
  retailValue: number;
  isLowStock: boolean;
}

export interface StockValueReportResult {
  totalStockValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  lowStockCount: number;
  totalProducts: number;
  items: StockValueItem[];
}

export interface ProductListResult {
  items: unknown[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class ProductService {
  async list(businessId: string, query: ProductQuery): Promise<ProductListResult> {
    const { status, category, search, page = 1, limit = 50 } = query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const skip = (pageNum - 1) * limitNum;
    
    const match: FilterQuery<IProduct> = { businessId, deletedAt: null };
    if (status) match.status = status as IProduct["status"];
    if (category) match.category = category;
    if (search) {
      match.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $addFields: {
          idString: { $toString: "$_id" }
        }
      },
      {
        $lookup: {
          from: "inventories",
          localField: "idString",
          foreignField: "productId",
          as: "inventories",
        },
      },
    ];

    const [items, total] = await Promise.all([
      Product.aggregate(pipeline),
      Product.countDocuments(match),
    ]);

    return { items, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) };
  }

  async getById(id: string, businessId: string): Promise<Record<string, unknown>> {
    const p = await Product.findOne({ _id: id, businessId, deletedAt: null }).lean();
    if (!p) throw new AppError("Product not found", 404);
    
    const inventories = await Inventory.find({ productId: id, businessId }).lean();
    return { ...p, inventories };
  }

  async create(businessId: string, data: CreateProductInput, branchId?: string): Promise<IProduct> {
    if (!data.sku) {
      const count = await Product.countDocuments({ businessId });
      data.sku = `SKU-${(count + 1).toString().padStart(4, "0")}`;
    }

    const existing = await Product.findOne({ businessId, sku: data.sku, deletedAt: null });
    if (existing) throw new AppError(`SKU '${data.sku}' already exists`, 409);

    const product = await Product.create({ ...data, businessId });
    log.info("Product created", { productId: product._id, businessId });

    if (branchId) {
      const initialQty = Number(data.initialStock || 0);
      await Inventory.create({
        businessId,
        branchId,
        productId: product._id.toString(),
        quantityOnHand: initialQty,
        quantityReserved: 0,
        quantityAvailable: initialQty,
        averageCost: data.costPrice ?? 0,
        reorderPoint: data.reorderLevel ?? 5,
        reorderQuantity: data.reorderQuantity ?? 10,
      });
    }

    return product;
  }

  async update(id: string, businessId: string, data: Partial<IProduct>): Promise<IProduct> {
    if (data.sku) {
      const existing = await Product.findOne({
        businessId,
        sku: data.sku,
        _id: { $ne: id },
        deletedAt: null
      });
      if (existing) throw new AppError(`SKU '${data.sku}' already exists`, 409);
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, businessId, deletedAt: null },
      { $set: data },
      { new: true }
    );
    if (!product) throw new AppError("Product not found", 404);
    log.info("Product updated", { productId: id });
    return product;
  }

  async delete(id: string, businessId: string): Promise<{ success: boolean }> {
    const product = await Product.findOneAndUpdate(
      { _id: id, businessId, deletedAt: null },
      { $set: { deletedAt: new Date(), status: "INACTIVE" } },
      { new: true }
    );
    if (!product) throw new AppError("Product not found", 404);
    log.info("Product deleted", { productId: id });
    return { success: true };
  }

  async stockValueReport(businessId: string, branchId?: string): Promise<StockValueReportResult> {
    const productFilter: FilterQuery<IProduct> = { businessId, deletedAt: null, status: "ACTIVE" };
    const inventoryFilter: FilterQuery<IInventory> = { businessId };
    if (branchId) inventoryFilter.branchId = branchId;

    const [products, inventories] = await Promise.all([
      Product.find(productFilter).lean(),
      Inventory.find(inventoryFilter).lean(),
    ]);

    const invMap = new Map(inventories.map((i) => [i.productId, i]));

    let totalStockValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    const items: StockValueItem[] = [];

    for (const p of products) {
      const inv = invMap.get(p._id.toString());
      const qty = inv?.quantityOnHand ?? 0;
      const cost = inv?.averageCost ?? p.costPrice;
      const stockVal = qty * cost;
      const retailVal = qty * p.sellingPrice;
      const reorderPt = inv?.reorderPoint ?? 5;

      totalStockValue += stockVal;
      totalRetailValue += retailVal;
      if (qty <= reorderPt && qty >= 0) lowStockCount++;

      items.push({
        productId: p._id.toString(),
        name: p.name,
        sku: p.sku,
        quantityOnHand: qty,
        averageCost: cost,
        sellingPrice: p.sellingPrice,
        stockValue: stockVal,
        retailValue: retailVal,
        isLowStock: qty <= reorderPt,
      });
    }

    return {
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      totalRetailValue: Math.round(totalRetailValue * 100) / 100,
      potentialProfit: Math.round((totalRetailValue - totalStockValue) * 100) / 100,
      lowStockCount,
      totalProducts: products.length,
      items,
    };
  }
}

export const productService = new ProductService();
