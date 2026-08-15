import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CustomerBillingSummary } from '../../services/api/billingApi';
import { User } from '../../types/auth';
import {
  drawPdfHeader,
  drawPdfFooter,
  getCustomerPdfInfo,
  formatPdfCurrency,
  formatPdfDate,
  PDF_COLORS,
} from './pdfBase';

export const generateTaxInvoicePdf = (
  billingSummary: CustomerBillingSummary,
  user: User | null
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const customerInfo = getCustomerPdfInfo(user);
  const paidInvoices = (billingSummary?.recentInvoices || []).filter(
    (i) => i.status === 'Paid' || (i as any).status === 'Success'
  );
  const latestInvoice = paidInvoices.length > 0 ? paidInvoices[0] : null;

  const invoiceNumber = latestInvoice?.invoiceNumber || `INV-2026-${customerInfo.customerId.replace(/\D/g, '').slice(-6) || '000001'}`;
  const invoiceDate = latestInvoice ? formatPdfDate(latestInvoice.issueDate) : formatPdfDate(new Date().toISOString());

  // Header
  let y = drawPdfHeader(doc, 'TAX INVOICE', `Official GST / Tax Compliance Document`);

  // Invoice & Customer Info Grid
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8.5, cellPadding: 2, textColor: PDF_COLORS.bodyText },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 34 },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 56 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 34 },
      3: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 58 },
    },
    body: [
      [
        'Invoice Number:', invoiceNumber,
        'Customer Name:', customerInfo.name,
      ],
      [
        'Invoice Date:', invoiceDate,
        'Customer ID:', customerInfo.customerId,
      ],
      [
        'Subscription Plan:', billingSummary.currentPlanName,
        'Email:', customerInfo.email,
      ],
      [
        'Billing Cycle:', billingSummary.billingCycle,
        'Mobile:', customerInfo.mobile,
      ],
      [
        'Payment Status:', latestInvoice ? 'PAID' : 'NO PAID INVOICE',
        'Billing Address:', `${customerInfo.address}, ${customerInfo.country}`,
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Itemized Invoice Table
  const hasPaidTransactions = paidInvoices.length > 0;

  let itemsData: any[][] = [];
  let subtotal = 0;
  let taxAmount = 0;
  let discountAmount = billingSummary.totalSavings || 0;
  let grandTotal = 0;

  if (hasPaidTransactions && latestInvoice) {
    const totalPaid = latestInvoice.amount || billingSummary.currentSubscriptionCost || 0;
    subtotal = Math.round(totalPaid / 1.18);
    taxAmount = totalPaid - subtotal;
    grandTotal = totalPaid;

    if (latestInvoice.items && latestInvoice.items.length > 0) {
      itemsData = latestInvoice.items.map((item) => [
        item.description,
        item.quantity || 1,
        formatPdfCurrency(item.unitPrice || item.amount),
        formatPdfCurrency(Math.round((item.amount || 0) * 0.18)),
        formatPdfCurrency(item.amount),
      ]);
    } else {
      itemsData = [
        [
          `Subscription Service (${billingSummary.currentPlanName} - ${billingSummary.billingCycle})`,
          1,
          formatPdfCurrency(subtotal),
          formatPdfCurrency(taxAmount),
          formatPdfCurrency(grandTotal),
        ],
      ];
    }
  } else {
    // Empty state item
    itemsData = [
      [
        'No completed paid transactions available for tax invoice.',
        0,
        formatPdfCurrency(0),
        formatPdfCurrency(0),
        formatPdfCurrency(0),
      ],
    ];
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Description', 'Qty', 'Unit Price', 'GST (18%)', 'Total']],
    body: itemsData,
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: PDF_COLORS.bodyText,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'center', cellWidth: 16 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
      4: { fontStyle: 'bold', halign: 'right', cellWidth: 30 },
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.cardBg,
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Summary Breakdown Box (Subtotal, Tax, Discount, Grand Total)
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left: 100, right: 14 },
    styles: { fontSize: 8.5, cellPadding: 2, textColor: PDF_COLORS.bodyText },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 40, halign: 'right' },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 42, halign: 'right' },
    },
    body: [
      ['Subtotal:', formatPdfCurrency(subtotal)],
      ['Tax (18% GST Included):', formatPdfCurrency(taxAmount)],
      ['Discount Applied:', formatPdfCurrency(discountAmount)],
      ['Grand Total:', formatPdfCurrency(grandTotal)],
    ],
  });

  // Footer & Save
  drawPdfFooter(doc, 'Tax Invoice');
  const filename = `Tax-Invoice-${invoiceNumber}.pdf`;
  doc.save(filename);
};
