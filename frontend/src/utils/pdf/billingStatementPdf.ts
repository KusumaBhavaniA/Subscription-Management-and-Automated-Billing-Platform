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

export const generateBillingStatementPdf = (
  data: CustomerBillingSummary,
  user: User | null
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const customerInfo = getCustomerPdfInfo(user);
  const pageWidth = doc.internal.pageSize.getWidth();

  // Draw Header
  let y = drawPdfHeader(doc, 'Customer Billing Statement');

  // Helper for Section Titles
  const drawSectionTitle = (title: string, currentY: number): number => {
    doc.setFillColor(...PDF_COLORS.cardBg);
    doc.rect(14, currentY, pageWidth - 28, 7, 'F');
    doc.setDrawColor(...PDF_COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(14, currentY, 14, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.darkHeading);
    doc.text(title.toUpperCase(), 18, currentY + 5);

    return currentY + 10;
  };

  // ------------------------------------------------------------
  // SECTION 1: CUSTOMER INFORMATION
  // ------------------------------------------------------------
  y = drawSectionTitle('Customer Information', y);

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8.5, cellPadding: 2, textColor: PDF_COLORS.bodyText },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 38 },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 52 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 38 },
      3: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 54 },
    },
    body: [
      [
        'Customer Name:', customerInfo.name,
        'Account Created:', customerInfo.accountCreated,
      ],
      [
        'Customer ID:', customerInfo.customerId,
        'Account Status:', customerInfo.accountStatus,
      ],
      [
        'Email:', customerInfo.email,
        'Membership:', customerInfo.membershipStatus,
      ],
      [
        'Mobile:', customerInfo.mobile,
        'Country:', customerInfo.country,
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ------------------------------------------------------------
  // SECTION 2: CURRENT SUBSCRIPTION
  // ------------------------------------------------------------
  y = drawSectionTitle('Current Subscription', y);

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8.5, cellPadding: 2, textColor: PDF_COLORS.bodyText },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 38 },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.primary, cellWidth: 52 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 38 },
      3: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 54 },
    },
    body: [
      [
        'Plan:', data.currentPlanName,
        'Subscription Status:', data.subscriptionStatus,
      ],
      [
        'Billing Cycle:', data.billingCycle,
        'Renewal Date:', formatPdfDate(data.renewalDate),
      ],
      [
        'Current Plan Cost:', formatPdfCurrency(data.currentSubscriptionCost),
        'Next Billing Amount:', formatPdfCurrency(data.nextBillingAmount),
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ------------------------------------------------------------
  // SECTION 3: SPENDING SUMMARY
  // ------------------------------------------------------------
  y = drawSectionTitle('Spending Summary', y);

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8.5, cellPadding: 2, textColor: PDF_COLORS.bodyText },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 42 },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 48 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 42 },
      3: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 50 },
    },
    body: [
      [
        'Total Spent:', formatPdfCurrency(data.totalSpent),
        'Average Monthly Spend:', formatPdfCurrency(data.averageMonthlySpend),
      ],
      [
        'Total Savings:', formatPdfCurrency(data.totalSavings),
        'Payments Completed:', `${data.paymentsCompletedCount} Transactions`,
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ------------------------------------------------------------
  // SECTION 4: PAYMENT HISTORY
  // ------------------------------------------------------------
  y = drawSectionTitle('Payment History', y);

  if (!data.recentInvoices || data.recentInvoices.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.secondaryText);
    doc.text('No payment transactions available yet.', 18, y + 4);
    y += 10;
  } else {
    const tableBody = data.recentInvoices.map((inv) => [
      inv.invoiceNumber,
      formatPdfDate(inv.issueDate),
      `Subscription Payment (${data.currentPlanName})`,
      'Credit Card / Razorpay',
      formatPdfCurrency(inv.amount),
      inv.status,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Transaction ID', 'Date', 'Description', 'Payment Method', 'Amount', 'Status']],
      body: tableBody,
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.white,
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: PDF_COLORS.bodyText,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 32 },
        1: { cellWidth: 24 },
        2: { cellWidth: 52 },
        3: { cellWidth: 36 },
        4: { fontStyle: 'bold', halign: 'right', cellWidth: 24 },
        5: { halign: 'center', cellWidth: 14 },
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.cardBg,
      },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Check if space left for Account Summary, else add page
  if (y > 230) {
    doc.addPage();
    y = drawPdfHeader(doc, 'Customer Billing Statement (Contd.)');
  }

  // ------------------------------------------------------------
  // SECTION 5: ACCOUNT SUMMARY
  // ------------------------------------------------------------
  y = drawSectionTitle('Account Summary', y);

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8.5, cellPadding: 2, textColor: PDF_COLORS.bodyText },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 38 },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 52 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 38 },
      3: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 54 },
    },
    body: [
      [
        'Customer Since:', customerInfo.accountCreated,
        'Membership Status:', customerInfo.membershipStatus,
      ],
      [
        'Current Plan:', data.currentPlanName,
        'Total Payments:', `${data.paymentsCompletedCount} Completed`,
      ],
      [
        'Lifetime Savings:', formatPdfCurrency(data.totalSavings),
        'Account Status:', customerInfo.accountStatus,
      ],
    ],
  });

  // Draw Footer on all pages
  drawPdfFooter(doc, 'Customer Billing Statement');

  // Trigger browser download directly
  const dateToday = new Date().toISOString().split('T')[0];
  const filename = `Billing-Statement-${customerInfo.customerId}-${dateToday}.pdf`;
  doc.save(filename);
};
