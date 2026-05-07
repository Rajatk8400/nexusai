import { Sale, Product, Purchase } from "../models";
import { AppError } from "../utils/AppError";

export class ReportService {
  async getGSTR1(businessId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const sales = await Sale.find({
      businessId,
      deletedAt: null,
      status: { $nin: ["CANCELLED", "REFUNDED"] },
      saleDateAt: { $gte: startDate, $lte: endDate }
    }).lean();

    const b2b: any[] = [];
    const b2c: any[] = [];
    const hsnSummary: Record<string, any> = {};

    for (const sale of sales) {
      const entry = {
        invoiceNumber: sale.invoiceNumber,
        date: sale.saleDateAt,
        totalValue: sale.totalAmount,
        taxableValue: sale.subtotal,
        totalTax: sale.taxAmount,
        cgst: sale.cgst,
        sgst: sale.sgst,
        igst: sale.igst,
        customerName: sale.customerName,
        receiverGst: (sale as any).customerGst || (sale as any).customerPhone || "Unregistered"
      };

      if ((sale as any).customerGst) {
        b2b.push(entry);
      } else {
        b2c.push(entry);
      }

      // HSN Summary
      for (const item of (sale as any).items) {
        const hsn = (item as any).hsnCode || "NA";
        if (!hsnSummary[hsn]) {
          hsnSummary[hsn] = {
            hsn,
            description: (item as any).productName,
            qty: 0,
            val: 0,
            taxableVal: 0,
            tax: 0
          };
        }
        hsnSummary[hsn].qty += (item as any).quantity;
        hsnSummary[hsn].val += (item as any).totalAmount;
        hsnSummary[hsn].taxableVal += ((item as any).unitPrice * (item as any).quantity) - ((item as any).discountAmt || 0);
        hsnSummary[hsn].tax += (item as any).taxAmount;
      }
    }

    const purchases = await Purchase.find({
      businessId,
      purchaseDateAt: { $gte: startDate, $lte: endDate }
    }).lean();

    const totalITC = purchases.reduce((acc, p) => acc + (p.taxAmount || 0), 0);
    const totalTax = sales.reduce((acc, s) => acc + (s.taxAmount || 0), 0);

    return {
      period: `${month}-${year}`,
      totalTax,
      totalITC,
      summary: {
        totalSales: sales.length,
        totalRevenue: sales.reduce((acc, s) => acc + s.totalAmount, 0),
        totalTax,
      },
      b2bInvoices: b2b,
      b2cInvoices: b2c,
      hsn: Object.values(hsnSummary)
    };
  }
}

export const reportService = new ReportService();
