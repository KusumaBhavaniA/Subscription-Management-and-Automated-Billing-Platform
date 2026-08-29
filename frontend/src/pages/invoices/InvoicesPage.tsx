import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Eye, CheckCircle2, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage';
import { Invoice } from '../../types/invoice';
import { useAuth } from '../../hooks/useAuth';
import { billingApi } from '../../services/api/billingApi';

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    getItem<Invoice[]>(STORAGE_KEYS.INVOICES, [])
  );

  useEffect(() => {
    const fetchInvoices = async () => {
      const authSession = getItem<any>(STORAGE_KEYS.AUTH, null);
      const token = typeof authSession === 'string' ? authSession : (authSession?.token || authSession?.access_token || authSession?.user?.token || null);
      try {
        const res = await fetch('http://localhost:8000/invoices/me', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.invoices)) {
            setInvoices(data.invoices);
            setItem(STORAGE_KEYS.INVOICES, data.invoices);
            return;
          }
        }
      } catch (e) {
        console.warn('GET /invoices/me error:', e);
      }
    };
    fetchInvoices();
  }, [user]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [description, setDescription] = useState('');

  const displayInvoices = invoices.filter((inv) => {
    const matchesRole = isAdmin || !inv.customerEmail || inv.customerEmail.toLowerCase() === user?.email.toLowerCase();
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesRole && matchesSearch && matchesStatus;
  });

  const totalCount = invoices.length;
  const paidCount = invoices.filter((i) => i.status === 'Paid').length;
  const pendingCount = invoices.filter((i) => i.status === 'Pending').length;
  const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;

  const handleDownloadPdf = async (inv?: Invoice) => {
    const summary = await billingApi.getCustomerBillingSummary(user?.email || 'customer@example.com');
    if (inv) {
      summary.recentInvoices = [inv, ...summary.recentInvoices.filter((i) => i.id !== inv.id)];
    }
    billingApi.downloadTaxInvoicePDF(summary, user);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custEmail || !invAmount) return;

    const numAmount = parseFloat(invAmount) || 0;
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-00${invoices.length + 1}`,
      customerName: custName,
      customerEmail: custEmail,
      amount: numAmount,
      status: 'Pending',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: [
        {
          id: `item-${Date.now()}`,
          description: description || 'Custom SaaS Billing Service',
          quantity: 1,
          unitPrice: numAmount,
          amount: numAmount,
        },
      ],
    };

    const updated = [newInv, ...invoices];
    setInvoices(updated);
    setItem(STORAGE_KEYS.INVOICES, updated);

    setIsCreateModalOpen(false);
    setCustName('');
    setCustEmail('');
    setInvAmount('');
    setDescription('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <PageHeader
        title={isAdmin ? 'Invoices & Billing Statements' : 'My Invoices'}
        subtitle="Generate new billing statements, inspect paid receipts, and export statements."
        icon={FileText}
      >
        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Invoice
          </Button>
        )}
      </PageHeader>

      {/* Summary Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Total Invoices</span>
          <p className="text-xl sm:text-2xl font-black text-heading mt-1">{totalCount}</p>
          <span className="text-[10px] text-secondaryText font-medium">All generated statements</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Paid Invoices</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{paidCount}</p>
          <span className="text-[10px] text-mutedText font-medium">Settled receipts</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Pending Payment</span>
          <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
          <span className="text-[10px] text-mutedText font-medium">Awaiting settlement</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Overdue Invoices</span>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{overdueCount}</p>
          <span className="text-[10px] text-mutedText font-medium">Past due date</span>
        </Card>
      </div>

      {/* Search Bar & Filter Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md w-full">
          <SearchInput
            placeholder="Search by invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        </div>

        <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-xl border border-border self-start sm:self-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Invoices' },
            { id: 'Paid', label: 'Paid' },
            { id: 'Pending', label: 'Pending' },
            { id: 'Overdue', label: 'Overdue' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-secondaryText hover:text-heading hover:bg-secondary/80'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Invoice Table */}
      <Card className="p-0 overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-mutedText text-[11px] uppercase tracking-wider bg-tableHeader">
                <th className="py-3 px-4 font-bold">Invoice ID</th>
                <th className="py-3 px-4 font-bold">Customer</th>
                <th className="py-3 px-4 font-bold">Issue Date</th>
                <th className="py-3 px-4 font-bold">Due Date</th>
                <th className="py-3 px-4 font-bold text-right">Amount</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={FileText}
                      title="No Invoices Found"
                      description="Invoices will appear here once billing activity is generated."
                      actionLabel={isAdmin ? 'Create Invoice' : undefined}
                      onAction={isAdmin ? () => setIsCreateModalOpen(true) : undefined}
                    />
                  </td>
                </tr>
              ) : (
                displayInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-tableHover transition-colors group">
                    <td className="py-3 px-4 font-mono font-bold text-heading">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={inv.customerName || 'Customer'} size="sm" />
                        <div>
                          <span className="font-bold text-heading block">{inv.customerName || 'Customer'}</span>
                          <span className="text-[10px] text-mutedText font-mono">{inv.customerEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-secondaryText font-medium">{formatDate(inv.issueDate)}</td>
                    <td className="py-3 px-4 text-secondaryText font-medium">{formatDate(inv.dueDate)}</td>
                    <td className="py-3 px-4 font-black text-right text-heading font-mono">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={inv.status === 'Paid' ? 'PAID' : inv.status === 'Overdue' ? 'OVERDUE' : 'PENDING'}
                        dot
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedInvoice(inv)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                          onClick={() => handleDownloadPdf(inv)}
                        >
                          PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* VIEW INVOICE DETAIL MODAL */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice Statement: ${selectedInvoice.invoiceNumber}`}
          size="lg"
        >
          <div className="space-y-4 text-xs p-1">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Billed To</span>
                <div className="font-extrabold text-heading text-sm">{selectedInvoice.customerName}</div>
                <div className="text-secondaryText">{selectedInvoice.customerEmail}</div>
                <div className="text-mutedText text-[11px] mt-0.5">
                  {user?.address
                    ? `${user.address}, ${user.city || ''}, ${user.state || ''} ${user.zipCode || ''}, ${user.country || 'India'}`
                    : 'India'}
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={selectedInvoice.status === 'Paid' ? 'PAID' : selectedInvoice.status === 'Overdue' ? 'OVERDUE' : 'PENDING'}
                  dot
                >
                  {selectedInvoice.status}
                </Badge>
                <div className="text-[11px] text-mutedText mt-2">
                  Issue Date: <strong className="text-heading">{formatDate(selectedInvoice.issueDate)}</strong>
                </div>
                <div className="text-[11px] text-mutedText">
                  Due Date: <strong className="text-heading">{formatDate(selectedInvoice.dueDate)}</strong>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-tableHeader border-b border-border text-mutedText text-[10px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-2.5">Item / Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(selectedInvoice.items && selectedInvoice.items.length > 0
                    ? selectedInvoice.items
                    : [
                        {
                          id: '1',
                          description: 'SaaS Subscription Tier Service',
                          quantity: 1,
                          unitPrice: selectedInvoice.amount,
                          amount: selectedInvoice.amount,
                        },
                      ]
                  ).map((item) => (
                    <tr key={item.id}>
                      <td className="p-2.5 font-bold text-heading">{item.description}</td>
                      <td className="p-2.5 text-center text-secondaryText">{item.quantity || 1}</td>
                      <td className="p-2.5 text-right text-secondaryText">{formatCurrency(item.unitPrice || item.amount)}</td>
                      <td className="p-2.5 text-right font-extrabold text-heading">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-right">
                <div className="flex justify-between text-secondaryText">
                  <span>Subtotal:</span>
                  <span className="font-bold">{formatCurrency(Math.round(selectedInvoice.amount / 1.10))}</span>
                </div>
                <div className="flex justify-between text-secondaryText">
                  <span>GST Tax (10%):</span>
                  <span className="font-bold">
                    {formatCurrency(selectedInvoice.amount - Math.round(selectedInvoice.amount / 1.10))}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-heading pt-2 border-t border-border">
                  <span>Total Amount:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedInvoice.amount)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownloadPdf(selectedInvoice)}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download PDF Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE INVOICE MODAL (ADMIN) */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Generate New Billing Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <Input label="Customer Name" value={custName} onChange={(e) => setCustName(e.target.value)} required />
          <Input label="Customer Email" type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} required />
          <Input label="Amount (₹)" type="number" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} required />
          <Input
            label="Service Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Pro Business Tier Monthly Retainer"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Issue Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

