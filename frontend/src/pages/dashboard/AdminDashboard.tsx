import React from 'react';
import { DollarSign, Users, CreditCard, FileText, ArrowUpRight, TrendingUp, Plus, Download } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { getItem, STORAGE_KEYS } from '../../utils/storage';
import { Invoice } from '../../types/invoice';
import { Customer } from '../../types/customer';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const invoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
  const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);

  const totalMRR = customers.reduce((sum, c) => sum + (c.mrr || 0), 0);
  const totalRevenue = invoices.reduce((sum, inv) => inv.status === 'Paid' ? sum + inv.amount : sum, 0);
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-heading">Admin Dashboard</h1>
            <Badge variant="brand">Admin Mode</Badge>
          </div>
          <p className="text-xs text-secondaryText mt-1">
            Real-time platform overview, subscriber metrics, and automated billing control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => navigate('/admin/reports')}
          >
            Export Report
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/admin/invoices')}
          >
            Create Invoice
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mutedText uppercase tracking-wider">Monthly Recurring Revenue</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-heading">{formatCurrency(totalMRR)}</div>
            <div className="flex items-center gap-1 text-[11px] text-success font-bold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+14.2% from last month</span>
            </div>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mutedText uppercase tracking-wider">Total Revenue Collected</span>
            <div className="p-2 rounded-xl bg-success-bg text-success">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-heading">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center gap-1 text-[11px] text-success font-bold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+8.5% YoY</span>
            </div>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mutedText uppercase tracking-wider">Active Customers</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-heading">{activeCustomers}</div>
            <div className="text-[11px] text-mutedText mt-1">Total {customers.length} registered</div>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mutedText uppercase tracking-wider">Pending Invoices</span>
            <div className="p-2 rounded-xl bg-warning-bg text-warning">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-heading">{pendingInvoices}</div>
            <div className="text-[11px] text-warning font-semibold mt-1">Awaiting client payment</div>
          </div>
        </Card>
      </div>

      {/* Quick Admin Actions & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-heading">Recent Invoices</h3>
            <button
              onClick={() => navigate('/admin/invoices')}
              className="text-xs font-bold text-primary hover:underline transition-colors"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                  <th className="p-3 font-semibold">Invoice</th>
                  <th className="p-3 font-semibold">Customer</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-tableHover transition-colors">
                    <td className="p-3 font-bold text-heading">{inv.invoiceNumber}</td>
                    <td className="p-3 text-secondaryText">{inv.customerName}</td>
                    <td className="p-3 font-semibold text-heading">{formatCurrency(inv.amount)}</td>
                    <td className="p-3">
                      <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Pending' ? 'warning' : 'error'}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right text-mutedText">{formatDate(inv.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Operations Box */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-heading">Quick Operations</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin/customers')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-primary/10 text-left transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primaryText">Manage Customers</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-mutedText group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/admin/plans')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-primary/10 text-left transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-success" />
                <span className="text-xs font-bold text-primaryText">Manage Pricing Plans</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-mutedText group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/admin/analytics')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-primary/10 text-left transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primaryText">View Financial Analytics</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-mutedText group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
