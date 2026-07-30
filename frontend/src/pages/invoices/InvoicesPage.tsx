import React, { useState } from 'react';
import { FileText, Plus, Search, Download } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage';
import { Invoice } from '../../types/invoice';
import { useAuth } from '../../hooks/useAuth';

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    getItem<Invoice[]>(STORAGE_KEYS.INVOICES, [])
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [description, setDescription] = useState('');

  const displayInvoices = invoices.filter((inv) => {
    const matchesRole = isAdmin || inv.customerEmail.toLowerCase() === user?.email.toLowerCase();
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesRole && matchesSearch && matchesStatus;
  });

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            {isAdmin ? 'Invoices & Billing Statements' : 'My Invoices'}
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            Generate new billing statements, inspect paid receipts, and export statements.
          </p>
        </div>

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
      </div>

      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-mutedText" />
          <input
            type="text"
            placeholder="Search by invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-xl border border-border self-start sm:self-auto">
          {['ALL', 'Paid', 'Pending', 'Overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                statusFilter === st ? 'bg-primary text-white shadow-sm' : 'text-secondaryText hover:text-primaryText hover:bg-secondary/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      <Card space-y-4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                <th className="p-3 font-semibold">Invoice ID</th>
                <th className="p-3 font-semibold">Customer</th>
                <th className="p-3 font-semibold">Issue Date</th>
                <th className="p-3 font-semibold">Due Date</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">PDF Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-tableHover transition-colors">
                  <td className="p-3 font-bold text-heading">{inv.invoiceNumber}</td>
                  <td className="p-3 text-secondaryText">
                    <div className="font-semibold text-primaryText">{inv.customerName}</div>
                    <div className="text-[10px] text-mutedText">{inv.customerEmail}</div>
                  </td>
                  <td className="p-3 text-mutedText">{formatDate(inv.issueDate)}</td>
                  <td className="p-3 text-mutedText">{formatDate(inv.dueDate)}</td>
                  <td className="p-3 font-bold text-heading">{formatCurrency(inv.amount)}</td>
                  <td className="p-3">
                    <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Pending' ? 'warning' : 'error'}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => alert(`Downloading Invoice ${inv.invoiceNumber} PDF...`)}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Generate New Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <Input label="Customer Name" value={custName} onChange={(e) => setCustName(e.target.value)} required />
          <Input label="Customer Email" type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} required />
          <Input label="Amount (₹)" type="number" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} required />
          <Input label="Service Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Pro Business Monthly Plan" />
          <Button type="submit" variant="primary" className="w-full mt-2">
            Issue Invoice
          </Button>
        </form>
      </Modal>
    </div>
  );
};
