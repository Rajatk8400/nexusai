import { Sale, Purchase, ISale, ISaleItem } from "../models";

export interface GSTInvoiceEntry {
  invoiceNumber: string;
  date: Date;
  totalValue: number;
  taxableValue: number;
  totalTax: number;
  cgst: number;
  sgst: number;
  igst: number;
  customerName?: string;
  receiverGst: string;
}

export interface HSNItemSummary {
  hsn: string;
  description: string;
  qty: number;
  val: number;
  taxableVal: number;
  tax: number;
}

export interface GSTR1ReportResult {
  period: string;
  totalTax: number;
  totalITC: number;
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalTax: number;
  };
  b2bInvoices: GSTInvoiceEntry[];
  b2cInvoices: GSTInvoiceEntry[];
  hsn: HSNItemSummary[];
}

export class ReportService {
  async getGSTR1(businessId: string, month: number, year: number): Promise<GSTR1ReportResult> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const sales = (await Sale.find({
      businessId,
      deletedAt: null,
      status: { $nin: ["CANCELLED", "REFUNDED"] },
      saleDateAt: { $gte: startDate, $lte: endDate }
    }).lean()) as unknown as ISale[];

    const b2b: GSTInvoiceEntry[] = [];
    const b2c: GSTInvoiceEntry[] = [];
    const hsnSummary: Record<string, HSNItemSummary> = {};

    for (const sale of sales) {
      const receiverGst = sale.customerGst || sale.customerPhone || "Unregistered";
      const entry: GSTInvoiceEntry = {
        invoiceNumber: sale.invoiceNumber,
        date: sale.saleDateAt,
        totalValue: sale.totalAmount,
        taxableValue: sale.subtotal,
        totalTax: sale.taxAmount,
        cgst: sale.cgst,
        sgst: sale.sgst,
        igst: sale.igst,
        customerName: sale.customerName,
        receiverGst
      };

      if (sale.customerGst) {
        b2b.push(entry);
      } else {
        b2c.push(entry);
      }

      for (const item of (sale.items || [])) {
        const hsn = item.hsnCode || "NA";
        if (!hsnSummary[hsn]) {
          hsnSummary[hsn] = {
            hsn,
            description: item.productName || "Product",
            qty: 0,
            val: 0,
            taxableVal: 0,
            tax: 0
          };
        }
        hsnSummary[hsn].qty += item.quantity;
        hsnSummary[hsn].val += item.totalAmount;
        hsnSummary[hsn].taxableVal += ((item.unitPrice * item.quantity) - (item.discountAmt || 0));
        hsnSummary[hsn].tax += item.taxAmount;
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
