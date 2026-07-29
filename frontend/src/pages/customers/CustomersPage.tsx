import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Eye, ShieldCheck, CreditCard, UserX, UserCheck, Trash2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage';
import { Customer, AccountStatus, SubscriptionStatus } from '../../types/customer';
import { customerApi } from '../../services/api/customerApi';
import { useAuth } from '../../hooks/useAuth';
import { CustomerDetailsPage } from './CustomerDetailsPage';

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [customers, setCustomers] = useState<Customer[]>(() => getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []));
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Add Customer Form Fields (Profile ONLY - Decoupled Architecture)
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Keep local storage synchronized
    setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }, [customers]);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.subscriptionPlan && c.subscriptionPlan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.customerId && c.customerId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'All' ||
      c.accountStatus === statusFilter ||
      c.subscriptionStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await customerApi.createCustomer({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        companyName: newCompany.trim(),
        notes: newNotes.trim(),
      });

      if (res.success && res.data) {
        setCustomers([res.data, ...customers]);
        setToastMsg(`Customer profile for ${res.data.name} created successfully.`);
        setShowToast(true);
        setIsAddModalOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewCompany('');
        setNewNotes('');
      }
    } catch (err: any) {
      setToastMsg('Failed to create customer profile.');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountStatusChange = async (cust: Customer, newStatus: AccountStatus) => {
    const res = await customerApi.updateAccountStatus(cust.id, newStatus);
    if (res.success) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === cust.id ? { ...c, accountStatus: newStatus, status: newStatus } : c))
      );
      setToastMsg(`Updated account status for ${cust.name} to ${newStatus}.`);
      setShowToast(true);
    }
  };

  const handleCustomerUpdated = (updatedCust: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
    setSelectedCustomer(updatedCust);
  };

  const getAccountBadgeVariant = (st: AccountStatus) => {
    switch (st) {
      case 'Verified':
        return 'success';
      case 'Pending Verification':
        return 'warning';
      case 'Suspended':
        return 'error';
      case 'Deleted':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getSubBadgeVariant = (st: SubscriptionStatus) => {
    switch (st) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'neutral';
      case 'Expired':
        return 'warning';
      case 'Cancelled':
        return 'error';
      default:
        return 'neutral';
    }
  };

  // If a customer is selected, render the dedicated Customer Details View
  if (selectedCustomer) {
    return (
      <CustomerDetailsPage
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
        onCustomerUpdated={handleCustomerUpdated}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Customer Directory & Accounts
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            Manage customer profiles, verify account status, track automated MRR, and review subscription statuses.
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Create Customer
          </Button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-mutedText" />
          <input
            type="text"
            placeholder="Search by name, email, phone, customer ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25 font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-secondaryText">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 rounded-lg border border-border bg-input text-primaryText font-bold focus:outline-none text-xs"
            >
              <option value="All">All Accounts & Subscriptions</option>
              <option value="Verified">Account: Verified</option>
              <option value="Pending Verification">Account: Pending Verification</option>
              <option value="Suspended">Account: Suspended</option>
              <option value="Active">Subscription: Active</option>
              <option value="Inactive">Subscription: Inactive</option>
              <option value="Cancelled">Subscription: Cancelled</option>
            </select>
          </div>
          <span className="text-xs text-mutedText font-medium">
            Showing <strong className="text-heading font-bold">{filteredCustomers.length}</strong> accounts
          </span>
        </div>
      </Card>

      {/* CUSTOMER DIRECTORY TABLE */}
      <Card space-y-4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                <th className="p-3 font-semibold">Customer Name</th>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">Phone</th>
                <th className="p-3 font-semibold">Current Plan</th>
                <th className="p-3 font-semibold">MRR</th>
                <th className="p-3 font-semibold">Subscription Status</th>
                <th className="p-3 font-semibold">Account Status</th>
                <th className="p-3 font-semibold">Joined Date</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-mutedText">
                    No customers found matching the search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const accStatus = cust.accountStatus || 'Verified';
                  const subStatus = cust.subscriptionStatus || 'Inactive';
                  const currentPlan = cust.subscriptionPlan || 'No Plan';

                  return (
                    <tr key={cust.id} className="hover:bg-tableHover transition-colors">
                      {/* Clickable Customer Name */}
                      <td className="p-3 font-medium">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(cust)}
                          className="font-extrabold text-heading text-sm hover:text-primary transition-colors text-left focus:outline-none"
                        >
                          {cust.name}
                        </button>
                        <div className="text-[10px] text-mutedText font-mono mt-0.5">
                          {cust.customerId || `CUS-2026-${cust.id.slice(-3)}`}
                        </div>
                      </td>

                      <td className="p-3 font-medium text-secondaryText">{cust.email}</td>

                      <td className="p-3 font-mono text-secondaryText">{cust.phone || '—'}</td>

                      <td className="p-3">
                        <div className="font-bold text-primaryText">{currentPlan}</div>
                        <div className="text-[10px] text-mutedText">{cust.billingCycle || 'Monthly'}</div>
                      </td>

                      <td className="p-3 font-extrabold text-heading text-sm">
                        {formatCurrency(cust.mrr || 0)}
                      </td>

                      <td className="p-3">
                        <Badge variant={getSubBadgeVariant(subStatus)}>{subStatus}</Badge>
                      </td>

                      <td className="p-3">
                        <Badge variant={getAccountBadgeVariant(accStatus)}>{accStatus}</Badge>
                      </td>

                      <td className="p-3 text-mutedText font-medium">{formatDate(cust.joinedDate)}</td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedCustomer(cust)}
                            title="View Customer Details Page"
                          >
                            View
                          </Button>

                          {isAdmin && (
                            <select
                              value=""
                              onChange={(e) => {
                                const action = e.target.value;
                                if (action === 'view') setSelectedCustomer(cust);
                                if (action === 'suspend') handleAccountStatusChange(cust, 'Suspended');
                                if (action === 'restore') handleAccountStatusChange(cust, 'Verified');
                                if (action === 'delete') handleAccountStatusChange(cust, 'Deleted');
                              }}
                              className="text-[10px] font-bold p-1 rounded border border-border bg-input text-primaryText focus:outline-none cursor-pointer"
                              title="Quick Customer Governance Actions"
                            >
                              <option value="" disabled>
                                Actions
                              </option>
                              <option value="view">View Details</option>
                              {accStatus !== 'Suspended' ? (
                                <option value="suspend">Suspend Account</option>
                              ) : (
                                <option value="restore">Restore Account</option>
                              )}
                              <option value="delete">Soft Delete Account</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ADMIN CREATE CUSTOMER MODAL (SMALL, CLEAN, PROFILE ONLY) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Customer Profile"
      >
        <form onSubmit={handleAddCustomer} className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-2">
          <p className="text-secondaryText font-medium">
            Create a new customer profile. Subscriptions and plans are managed separately.
          </p>

          <Input
            label="Full Name *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Vikramaditya Rao"
            required
          />

          <Input
            label="Email Address *"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="vikram@company.com"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="+91 9876543210"
          />

          <Input
            label="Company Name (Optional)"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            placeholder="e.g. AcroTech Systems"
          />

          <div>
            <label className="block text-xs font-bold text-secondaryText mb-1.5">
              Admin Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Add internal notes about this customer profile..."
              className="w-full p-2.5 rounded-xl border border-border bg-input text-primaryText font-medium focus:outline-none focus:ring-2 focus:ring-primary/25 text-xs"
            />
          </div>

          <div className="p-3 rounded-xl bg-secondary border border-border space-y-1">
            <span className="font-bold text-heading text-[11px]">Default Customer State:</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-secondaryText pt-1">
              <div>• Account Status: <strong>Pending Verification</strong></div>
              <div>• Current Plan: <strong>No Plan</strong></div>
              <div>• Subscription Status: <strong>Inactive</strong></div>
              <div>• MRR: <strong>₹0.00</strong></div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Customer
            </Button>
          </div>
        </form>
      </Modal>

      <Toast
        isVisible={showToast}
        message={toastMsg}
        type="success"
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};
