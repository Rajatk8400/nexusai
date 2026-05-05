import { jsPDF } from "jspdf";
import autoTablePlugin from "jspdf-autotable";
import { Sale } from "../services/api";

// Safely get the autoTable function whether it's default exported or named
const autoTable = (typeof autoTablePlugin === "function" ? autoTablePlugin : (autoTablePlugin as any).default || (autoTablePlugin as any).autoTable) as any;

export const generateBillPDF = (sale: Sale, businessName: string, gstNumber?: string) => {
  const doc = new jsPDF() as any;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text(businessName, 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100);

  if (gstNumber) {
    doc.text(`GSTIN: ${gstNumber}`, 105, 26, { align: "center" });
    doc.text("TAX INVOICE", 105, 32, { align: "center" });
    doc.setDrawColor(200);
    doc.line(20, 38, 190, 38);
  } else {
    doc.text("TAX INVOICE", 105, 28, { align: "center" });
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);
  }

  // Bill Details
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, 45);
  doc.setFont("helvetica", "normal");
  doc.text(sale.customerName || "Walk-in Customer", 20, 50);
  if (sale.customerPhone) {
    doc.text(`Phone: ${sale.customerPhone}`, 20, 55);
  }

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Details:", 140, 45);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice #: ${sale.invoiceNumber}`, 140, 50);
  doc.text(`Date: ${new Date(sale.saleDateAt).toLocaleDateString("en-IN")}`, 140, 55);
  doc.text(`Method: ${sale.paymentMethod}`, 140, 60);

  // Table
  const tableData = (sale.items || []).map((item, index) => [
    index + 1,
    item.productName || "Item",
    item.quantity || 1,
    `₹${(item.unitPrice || 0).toFixed(2)}`,
    `${item.taxRate || 0}%`,
    `₹${(item.totalAmount || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 70,
    head: [["#", "Product", "Qty", "Price", "GST", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 15 },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 15, halign: "right" },
      5: { cellWidth: 30, halign: "right" },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 150;

  // Totals
  const summaryX = 140;
  doc.setFont("helvetica", "normal");
  doc.text(`Subtotal:`, summaryX, finalY + 15);
  doc.text(`₹${(sale.subtotal || 0).toFixed(2)}`, 190, finalY + 15, { align: "right" });
  
  doc.text(`GST Amount:`, summaryX, finalY + 22);
  doc.text(`₹${(sale.taxAmount || 0).toFixed(2)}`, 190, finalY + 22, { align: "right" });

  // Total Divider
  doc.setDrawColor(200);
  doc.line(summaryX, finalY + 28, 190, finalY + 28);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total:`, summaryX, finalY + 35);
  doc.text(`₹${(sale.totalAmount || 0).toFixed(2)}`, 190, finalY + 35, { align: "right" });

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100);
  doc.text("Computer generated invoice", 105, finalY + 50, { align: "center" });

  return doc;
};

export const shareToWhatsApp = (sale: Sale, businessName: string, upiId?: string) => {
  let paymentText = "";
  if (upiId && sale.paymentStatus === "PENDING") {
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${sale.totalAmount}&cu=INR`;
    paymentText = `\n\n*Pay Now via UPI:* ${upiLink}`;
  }

  const message = `*INVOICE FROM ${businessName.toUpperCase()}*

Hello ${sale.customerName || "Customer"},

Thank you for shopping with us! Here are your bill details:

*Invoice:* #${sale.invoiceNumber}
*Date:* ${new Date(sale.saleDateAt).toLocaleDateString("en-IN")}
*Items:* ${sale.items.length}
---------------------------
*Total Amount: ₹${sale.totalAmount.toFixed(2)}*
---------------------------${paymentText}

Download your detailed bill here: [Internal Link or PDF]

Have a great day!`;

  const encodedMessage = encodeURIComponent(message);
  const phone = sale.customerPhone ? sale.customerPhone.replace(/\D/g, "") : "";
  
  // Use country code 91 if it's a 10 digit number
  const finalPhone = phone.length === 10 ? `91${phone}` : phone;
  
  window.open(`https://wa.me/${finalPhone}?text=${encodedMessage}`, "_blank");
};
