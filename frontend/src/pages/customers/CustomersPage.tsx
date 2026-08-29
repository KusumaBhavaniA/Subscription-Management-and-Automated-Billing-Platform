import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, ExternalLink, Eye, Ban, RotateCcw, Trash2, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchInput } from '../../components/common/SearchInput';
import { Avatar } from '../../components/common/Avatar';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Customer } from '../../types/customer';
import { customerApi } from '../../services/api/customerApi';

type DirectoryTab = 'active' | 'suspended' | 'deleted';

export const CustomersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DirectoryTab>('active');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Suspend Modal
  const [suspendTarget, setSuspendTarget] = useState<Customer | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  // Restore Modal
  const [restoreTarget, setRestoreTarget] = useState<Customer | null>(null);

  const fetchCustomers = async (tab: DirectoryTab = activeTab) => {
    setIsLoading(true);
    try {
      const list = await customerApi.getCustomers(tab);
      setCustomers(list);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(activeTab);
  }, [activeTab]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subscriptionPlan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  const handleSuspendConfirm = async () => {
    if (!suspendTarget) return;
    setIsSubmitting(true);
    try {
      await customerApi.suspendCustomer(suspendTarget.id, suspendReason);
      setSuspendTarget(null);
      setSuspendReason('');
      await fetchCustomers(activeTab);
    } catch (err) {
      console.error('Suspend failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await customerApi.softDeleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
      await fetchCustomers(activeTab);
    } catch (err) {
      console.error('Soft delete failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    setIsSubmitting(true);
    try {
      await customerApi.restoreCustomer(restoreTarget.id);
      setRestoreTarget(null);
      await fetchCustomers(activeTab);
    } catch (err) {
      console.error('Restore failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccountStatusBadge = (cust: Customer) => {
    if (cust.accountStatus === 'DELETED' || cust.deletedAt) {
      return <Badge variant="danger">DELETED</Badge>;
    }
    if (cust.accountStatus === 'SUSPENDED' || cust.status === 'Suspended') {
      return <Badge variant="warning">SUSPENDED</Badge>;
    }
    if (cust.status === 'Verified' || cust.isVerified) {
      return <Badge variant="success">ACTIVE</Badge>;
    }
    return <Badge variant="neutral">{cust.status}</Badge>;
  };

  const activeCount = customers.filter(
    (c) => c.accountStatus !== 'SUSPENDED' && c.accountStatus !== 'DELETED' && c.status !== 'Suspended' && !c.deletedAt
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Customer Directory"
        subtitle="Manage customer profiles, account states, suspensions, and recycle bin recovery."
        icon={Users}
      />

      {/* Navigation Tabs with Count Badges */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'active'
              ? 'bg-primary text-white shadow-xs'
              : 'text-secondaryText hover:text-heading hover:bg-secondary'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Active Customers</span>
        </button>

        <button
          onClick={() => setActiveTab('suspended')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'suspended'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-secondaryText hover:text-heading hover:bg-secondary'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>Suspended Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab('deleted')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'deleted'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-secondaryText hover:text-heading hover:bg-secondary'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Recycle Bin</span>
        </button>
      </div>

      {/* Search Bar & Counter */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md w-full">
          <SearchInput
            placeholder="Search customer name, email, phone, or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>
        <div className="text-xs text-secondaryText font-medium">
          Showing <span className="text-heading font-extrabold">{filteredCustomers.length}</span> records in{' '}
          <span className="capitalize font-bold text-primary">{activeTab === 'deleted' ? 'Recycle Bin' : activeTab}</span> view
        </div>
      </Card>

      {/* Table Section */}
      <Card className="p-0 overflow-hidden border border-border">
        {isLoading ? (
          <TableSkeleton rows={5} columns={activeTab === 'deleted' ? 6 : 7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-mutedText text-[11px] uppercase tracking-wider bg-tableHeader">
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">Email</th>
                  <th className="py-3 px-4 font-bold">Phone</th>
                  {activeTab === 'deleted' ? (
                    <>
                      <th className="py-3 px-4 font-bold">Joined Date</th>
                      <th className="py-3 px-4 font-bold">Deleted Date</th>
                      <th className="py-3 px-4 font-bold">Deleted By</th>
                      <th className="py-3 px-4 font-bold">Account Status</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4 font-bold">Current Plan</th>
                      <th className="py-3 px-4 font-bold text-right">MRR</th>
                      <th className="py-3 px-4 font-bold text-center">Sub Status</th>
                      <th className="py-3 px-4 font-bold text-center">Account Status</th>
                      <th className="py-3 px-4 font-bold">Joined Date</th>
                    </>
                  )}
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8">
                      <EmptyState
                        icon={Users}
                        title={
                          activeTab === 'active'
                            ? 'No Active Customers'
                            : activeTab === 'suspended'
                            ? 'No Suspended Customers'
                            : 'Customer Recycle Bin is Empty'
                        }
                        description={`No customer records match your filter criteria in the ${activeTab} section.`}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-tableHover transition-colors group">
                      {/* Customer Name + Avatar */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/admin/customers/${cust.id}`}
                          className="flex items-center gap-2.5 group/link cursor-pointer text-left"
                        >
                          <Avatar name={cust.name} size="sm" />
                          <div>
                            <span className="font-bold text-heading group-hover/link:text-primary transition-colors flex items-center gap-1">
                              {cust.name}
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 text-primary transition-opacity" />
                            </span>
                            {cust.customerId && (
                              <div className="text-[10px] font-mono text-mutedText">{cust.customerId}</div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-secondaryText font-medium">{cust.email}</td>
                      <td className="py-3 px-4 text-secondaryText font-mono text-[11px]">{cust.phone || '—'}</td>

                      {activeTab === 'deleted' ? (
                        <>
                          <td className="py-3 px-4 text-mutedText">{formatDate(cust.joinedDate)}</td>
                          <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-bold font-mono">
                            {cust.deletedAt ? formatDate(cust.deletedAt) : 'Recent'}
                          </td>
                          <td className="py-3 px-4 text-mutedText">{cust.deletedBy || 'Admin'}</td>
                          <td className="py-3 px-4">{getAccountStatusBadge(cust)}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 font-bold text-heading">
                            <span className="px-2 py-0.5 rounded-lg bg-secondary text-primary font-semibold text-[11px]">
                              {cust.subscriptionPlan}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black text-right text-emerald-600 dark:text-emerald-400 font-mono">
                            {formatCurrency(cust.mrr)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cust.subscriptionStatus === 'Active'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-secondary text-secondaryText border border-border'
                              }`}
                            >
                              {cust.subscriptionStatus || 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">{getAccountStatusBadge(cust)}</td>
                          <td className="py-3 px-4 text-mutedText">{formatDate(cust.joinedDate)}</td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/admin/customers/${cust.id}`}>
                            <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                              View
                            </Button>
                          </Link>

                          {activeTab === 'active' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Ban className="w-3.5 h-3.5 text-amber-500" />}
                                onClick={() => setSuspendTarget(cust)}
                                className="text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              >
                                Suspend
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                                onClick={() => setDeleteTarget(cust)}
                                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                Delete
                              </Button>
                            </>
                          )}

                          {activeTab === 'suspended' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                                onClick={() => setRestoreTarget(cust)}
                              >
                                Restore
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                                onClick={() => setDeleteTarget(cust)}
                                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                Delete
                              </Button>
                            </>
                          )}

                          {activeTab === 'deleted' && (
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                              onClick={() => setRestoreTarget(cust)}
                            >
                              Restore Account
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Suspend Confirmation Modal */}
      {suspendTarget && (
        <Modal
          isOpen={!!suspendTarget}
          onClose={() => setSuspendTarget(null)}
          title={`Suspend Customer: ${suspendTarget.name}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-secondaryText">
                <p className="font-bold text-heading">Account Suspension Notice</p>
                <p className="mt-0.5">
                  Suspending this account will block normal dashboard login. An automated email with a Support link will be dispatched to <strong>{suspendTarget.email}</strong>.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText mb-1">
                Reason for Suspension (Optional)
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Terms of Service violation, payment review required..."
                className="w-full p-2.5 bg-input border border-border rounded-lg text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-amber-500/25 min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSuspendTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleSuspendConfirm}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Confirm Suspension
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Soft Delete Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Soft Delete Customer: ${deleteTarget.name}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs text-secondaryText">
                <p className="font-bold text-heading">Move to Customer Recycle Bin</p>
                <p className="mt-0.5">
                  This action marks the account as <strong>DELETED</strong> and moves it to the Customer Recycle Bin. All invoices, payments, subscriptions, and Customer ID <strong>{deleteTarget.customerId}</strong> are preserved and can be restored anytime.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleSoftDeleteConfirm}
              >
                Soft Delete Account
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Restore Modal */}
      {restoreTarget && (
        <Modal
          isOpen={!!restoreTarget}
          onClose={() => setRestoreTarget(null)}
          title={`Restore Customer Account: ${restoreTarget.name}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-secondaryText">
                <p className="font-bold text-heading">Reactivate Customer Account</p>
                <p className="mt-0.5">
                  Restoring this account sets account status to <strong>ACTIVE</strong>. Customer ID <strong>{restoreTarget.customerId}</strong> and existing login credentials will be reactivated.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setRestoreTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleRestoreConfirm}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Restore Account Now
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
