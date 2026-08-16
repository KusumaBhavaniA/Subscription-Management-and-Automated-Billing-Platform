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

export const generatePaymentReceiptPdf = (
  billingSummary: CustomerBillingSummary,
  user: User | null
): { success: boolean; message?: string } => {
  const customerInfo = getCustomerPdfInfo(user);
  const paidInvoices = (billingSummary?.recentInvoices || []).filter(
    (i) => i.status === 'Paid' || (i as any).status === 'Success'
  );

  // If no completed payments/invoices, DO NOT generate fake receipt
  if (!paidInvoices || paidInvoices.length === 0) {
    return {
      success: false,
      message: 'No payment receipts are available because no completed payments exist.',
    };
  }

  const latestPayment = paidInvoices[0];
  const receiptNumber = `RCP-2026-${(latestPayment.invoiceNumber || '000001').replace(/\D/g, '').slice(-6) || '000001'}`;
  const paymentDate = formatPdfDate(latestPayment.issueDate);
  const amountPaid = latestPayment.amount;
  const txnId = latestPayment.invoiceNumber || `TXN-${Date.now().toString().slice(-8)}`;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header
  let y = drawPdfHeader(doc, 'PAYMENT RECEIPT', 'Official Proof of Payment');

  // Customer & Receipt Details
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 2.5, textColor: PDF_COLORS.bodyText },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 36 },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 54 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 36 },
      3: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 56 },
    },
    body: [
      [
        'Receipt Number:', receiptNumber,
        'Customer Name:', customerInfo.name,
      ],
      [
        'Transaction ID:', txnId,
        'Customer ID:', customerInfo.customerId,
      ],
      [
        'Payment Date:', paymentDate,
        'Email:', customerInfo.email,
      ],
      [
        'Payment Method:', 'Credit Card / Online Gateway',
        'Status:', 'SUCCESSFUL / PAID',
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Receipt Items Table
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Item Description', 'Billing Period', 'Amount Paid']],
    body: [
      [
        `Subscription Service Payment (${billingSummary.currentPlanName})`,
        billingSummary.billingCycle,
        formatPdfCurrency(amountPaid),
      ],
    ],
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3.5,
      textColor: PDF_COLORS.bodyText,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { cellWidth: 42 },
      2: { fontStyle: 'bold', halign: 'right', cellWidth: 40 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Total Box
  doc.setFillColor(...PDF_COLORS.emeraldBg);
  doc.roundedRect(14, y, doc.internal.pageSize.getWidth() - 28, 14, 2, 2, 'F');
  doc.setDrawColor(...PDF_COLORS.emerald);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, doc.internal.pageSize.getWidth() - 28, 14, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.emerald);
  doc.text('TOTAL PAID:', 20, y + 9);
  doc.text(formatPdfCurrency(amountPaid), doc.internal.pageSize.getWidth() - 20, y + 9, {
    align: 'right',
  });

  y += 22;

  // Thank You Message Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.darkHeading);
  doc.text('Thank You For Your Business!', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.secondaryText);
  doc.text(
    'This receipt confirms that your payment has been successfully received and credited to your account.\nFor any billing inquiries, please contact our support team.',
    14,
    y + 6
  );

  // Footer & Save
  drawPdfFooter(doc, 'Payment Receipt');
  const filename = `Payment-Receipt-${receiptNumber}.pdf`;
  doc.save(filename);

  return { success: true };
};
