import mongoose from "mongoose";
import { Sale, Product, Inventory, InventoryMovement, ISale, Customer } from "../models";
import { AppError } from "../utils/AppError";
import { createLogger } from "../config/logger";
import { customerService } from "./customer.service";

const log = createLogger("SaleService");

function calcGST(amount: number, taxRate: number, isInterState: boolean) {
  const taxAmount = (amount * taxRate) / 100;
  if (isInterState) return { cgst: 0, sgst: 0, igst: taxAmount, total: taxAmount };
  return { cgst: taxAmount / 2, sgst: taxAmount / 2, igst: 0, total: taxAmount };
}

async function nextInvoiceNumber(businessId: string): Promise<string> {
  const count = await Sale.countDocuments({ businessId });
  const year = new Date().getFullYear().toString().slice(-2);
  return `INV-${year}-${(count + 1).toString().padStart(5, "0")}`;
}

export class SaleService {
  async create(
    businessId: string,
    branchId: string,
    createdById: string,
    data: {
      items: { productId: string; quantity: number; unitPrice?: number; discountAmt?: number }[];
      customerName?: string;
      customerPhone?: string;
      customerGst?: string;
      paymentMethod?: string;
      notes?: string;
      saleDateAt?: Date;
      isInterState?: boolean;
    }
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Resolve products
      const productIds = data.items.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds }, businessId, deletedAt: null }).session(session);
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      let subtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      let totalProfit = 0;
      let cgst = 0, sgst = 0, igst = 0;
      const saleItems: any[] = [];

      for (const item of data.items) {
        const product = productMap.get(item.productId);
        if (!product) throw new AppError(`Product ${item.productId} not found`, 404);

        const unitPrice = item.unitPrice ?? product.sellingPrice;
        const discountAmt = item.discountAmt ?? 0;
        const lineSubtotal = unitPrice * item.quantity - discountAmt;
        const gstCalc = calcGST(lineSubtotal, product.taxRate, data.isInterState ?? false);

        const lineTotal = lineSubtotal + gstCalc.total;
        const profit = lineSubtotal - product.costPrice * item.quantity;

        subtotal += lineSubtotal;
        totalDiscount += discountAmt;
        totalTax += gstCalc.total;
        totalProfit += profit;
        cgst += gstCalc.cgst;
        sgst += gstCalc.sgst;
        igst += gstCalc.igst;

        saleItems.push({
          productId: item.productId,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice,
          costPrice: product.costPrice,
          discountAmt,
          taxRate: product.taxRate,
          taxAmount: gstCalc.total,
          totalAmount: lineTotal,
          profitAmount: profit,
        });

        // Deduct inventory
        const inv = await Inventory.findOne({ businessId, branchId, productId: item.productId }).session(session);
        if (!inv) throw new AppError(`No inventory record for product ${product.name}`, 400);
        if (inv.quantityAvailable < item.quantity) {
          throw new AppError(`Insufficient stock for ${product.name}. Available: ${inv.quantityAvailable}`, 400);
        }

        const before = inv.quantityOnHand;
        inv.quantityOnHand -= item.quantity;
        inv.quantityAvailable -= item.quantity;
        await inv.save({ session });

        await InventoryMovement.create([{
          businessId, branchId,
          productId: item.productId,
          type: "SALE",
          quantity: -item.quantity,
          quantityBefore: before,
          quantityAfter: inv.quantityOnHand,
          unitCost: product.costPrice,
          totalCost: product.costPrice * item.quantity,
          performedById: createdById,
        }], { session });
      }

      const invoiceNumber = await nextInvoiceNumber(businessId);

      // Handle Customer & Khata
      let customerId = null;
      if (data.customerPhone || data.customerName) {
        const customer = await customerService.upsert(businessId, {
          name: data.customerName || "Walk-in Customer",
          phone: data.customerPhone,
          gstNumber: data.customerGst
        });
        customerId = customer?._id.toString();
        
        // If it's a credit sale, record in ledger
        if (data.paymentMethod === "CREDIT") {
           await customerService.recordTransaction(
             businessId, 
             customerId!, 
             "SALE", 
             Math.round((subtotal + totalTax) * 100) / 100,
             invoiceNumber,
             `Credit Sale - Invoice #${invoiceNumber}`,
             "CREDIT"
           );
        }
      }

      const [sale] = await Sale.create([{
        businessId, branchId,
        invoiceNumber,
        saleDateAt: data.saleDateAt ?? new Date(),
        customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerGst: data.customerGst,
        items: saleItems,
        subtotal: Math.round(subtotal * 100) / 100,
        discountAmount: Math.round(totalDiscount * 100) / 100,
        taxAmount: Math.round(totalTax * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst: Math.round(igst * 100) / 100,
        totalAmount: Math.round((subtotal + totalTax) * 100) / 100,
        profitAmount: Math.round(totalProfit * 100) / 100,
        paymentMethod: data.paymentMethod ?? "CASH",
        paymentStatus: data.paymentMethod === "CREDIT" ? "PENDING" : "COMPLETED",
        status: "CONFIRMED",
        notes: data.notes,
        createdById,
        metadata: { profit: totalProfit },
      }], { session });

      await session.commitTransaction();
      log.info("Sale created", { saleId: sale._id, invoiceNumber, businessId });
      return sale;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async list(businessId: string, query: {
    branchId?: string; status?: string; paymentMethod?: string;
    from?: string; to?: string; page?: number; limit?: number;
  }): Promise<any> {
    const { branchId, status, paymentMethod, from, to, page = 1, limit = 20 } = query;
    const filter: any = { businessId, deletedAt: null };
    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (from || to) {
      filter.saleDateAt = {};
      if (from) filter.saleDateAt.$gte = new Date(from);
      if (to) filter.saleDateAt.$lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      Sale.find(filter).sort({ saleDateAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Sale.countDocuments(filter),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getById(id: string, businessId: string): Promise<any> {
    const sale = await Sale.findOne({ _id: id, businessId, deletedAt: null }).lean();
    if (!sale) throw new AppError("Sale not found", 404);
    return sale;
  }

  async getRevenueChart(businessId: string, months = 7, branchId?: string) {
    const results = [];
    for (let i = months - 1; i >= 0; i--) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const filter: any = {
        businessId,
        deletedAt: null,
        status: { $nin: ["CANCELLED", "REFUNDED"] },
        saleDateAt: { $gte: start, $lte: end },
      };
      if (branchId) filter.branchId = branchId;

      const agg = await Sale.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalTax: { $sum: "$taxAmount" },
            totalProfit: { $sum: "$profitAmount" },
            orderCount: { $sum: 1 },
          },
        },
      ]);

      const r = agg[0] ?? { totalRevenue: 0, totalTax: 0, totalProfit: 0, orderCount: 0 };
      const revenue = r.totalRevenue;
      const profit = r.totalProfit;

      results.push({
        month: start.toLocaleString("default", { month: "short", year: "2-digit" }),
        revenue: Math.round(revenue * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        tax: Math.round(r.totalTax * 100) / 100,
        cogs: Math.round((revenue - profit - r.totalTax) * 100) / 100,
        orders: r.orderCount,
      });
    }
    return results;
  }

  async getDashboardKPIs(businessId: string, branchId?: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const filter: any = {
      businessId, deletedAt: null,
      status: { $nin: ["CANCELLED", "REFUNDED"] },
    };
    if (branchId) filter.branchId = branchId;

    const [thisMonth, lastMonth, todayAgg] = await Promise.all([
      Sale.aggregate([
        { $match: { ...filter, saleDateAt: { $gte: startOfMonth } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" }, profit: { $sum: "$profitAmount" }, orders: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { ...filter, saleDateAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { ...filter, saleDateAt: { $gte: new Date(now.setHours(0,0,0,0)) } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
      ]),
    ]);

    const curr = thisMonth[0] ?? { revenue: 0, profit: 0, orders: 0 };
    const prev = lastMonth[0] ?? { revenue: 0, orders: 0 };
    const today = todayAgg[0] ?? { revenue: 0, orders: 0 };

    const revenueGrowth = prev.revenue > 0
      ? ((curr.revenue - prev.revenue) / prev.revenue) * 100
      : 0;

    return {
      monthRevenue: Math.round(curr.revenue * 100) / 100,
      monthProfit: Math.round(curr.profit * 100) / 100,
      monthOrders: curr.orders,
      todayRevenue: Math.round(today.revenue * 100) / 100,
      todayOrders: today.orders,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      profitMargin: curr.revenue > 0 ? Math.round((curr.profit / curr.revenue) * 10000) / 100 : 0,
    };
  }

  async updateEwayBill(businessId: string, saleId: string, ewayData: any) {
    const sale = await Sale.findOne({ _id: saleId, businessId, deletedAt: null });
    if (!sale) throw new AppError("Sale not found", 404);
    
    sale.ewayBill = {
      ewayBillNumber: ewayData.ewayBillNumber,
      transporterName: ewayData.transporterName,
      transporterId: ewayData.transporterId,
      vehicleNumber: ewayData.vehicleNumber,
      distance: ewayData.distance,
      supplyType: ewayData.supplyType,
    };
    
    await sale.save();
    return sale;
  }
}

export const saleService = new SaleService();
