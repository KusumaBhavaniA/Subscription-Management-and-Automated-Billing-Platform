import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, ExternalLink, Eye, Ban, RotateCcw, Trash2, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Customer Directory
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            Manage customer accounts, account states, suspensions, and recycle bin recovery.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-primary text-white shadow-md'
              : 'text-secondaryText hover:text-heading hover:bg-secondary/60'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Active Customers
        </button>

        <button
          onClick={() => setActiveTab('suspended')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'suspended'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-secondaryText hover:text-heading hover:bg-secondary/60'
          }`}
        >
          <Ban className="w-4 h-4" />
          Suspended Customers
        </button>

        <button
          onClick={() => setActiveTab('deleted')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'deleted'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-secondaryText hover:text-heading hover:bg-secondary/60'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Customer Recycle Bin
        </button>
      </div>

      {/* Search Bar & Counter */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-mutedText" />
          <input
            type="text"
            placeholder="Search customer name, email, phone, or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary font-medium"
          />
        </div>
        <div className="text-xs text-secondaryText font-semibold">
          Showing <span className="text-heading font-extrabold">{filteredCustomers.length}</span> records in{' '}
          <span className="capitalize font-bold text-primary">{activeTab === 'deleted' ? 'Recycle Bin' : activeTab}</span> view
        </div>
      </Card>

      {/* Table Section */}
      <Card space-y-4>
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-xs text-secondaryText mt-3 font-semibold">Loading customer directory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                  <th className="p-3 font-semibold">Customer Name</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Phone</th>
                  {activeTab === 'deleted' ? (
                    <>
                      <th className="p-3 font-semibold">Joined Date</th>
                      <th className="p-3 font-semibold">Deleted Date</th>
                      <th className="p-3 font-semibold">Deleted By</th>
                      <th className="p-3 font-semibold">Account Status</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3 font-semibold">Current Plan</th>
                      <th className="p-3 font-semibold">MRR</th>
                      <th className="p-3 font-semibold">Sub Status</th>
                      <th className="p-3 font-semibold">Account Status</th>
                      <th className="p-3 font-semibold">Joined Date</th>
                    </>
                  )}
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-secondaryText font-medium">
                      <AlertTriangle className="w-8 h-8 text-mutedText mx-auto mb-2" />
                      No customers found matching the criteria in this section.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-tableHover transition-colors group">
                      {/* Customer Name */}
                      <td className="p-3">
                        <Link
                          to={`/admin/customers/${cust.id}`}
                          className="font-bold text-heading hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer text-left group-hover:text-primary"
                        >
                          <span>{cust.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                        </Link>
                        {cust.customerId && (
                          <div className="text-[10px] font-mono text-mutedText">{cust.customerId}</div>
                        )}
                      </td>
                      <td className="p-3 text-secondaryText font-semibold">{cust.email}</td>
                      <td className="p-3 text-secondaryText font-medium">{cust.phone || 'N/A'}</td>

                      {activeTab === 'deleted' ? (
                        <>
                          <td className="p-3 text-mutedText font-medium">{formatDate(cust.joinedDate)}</td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 font-bold font-mono">
                            {cust.deletedAt ? formatDate(cust.deletedAt) : 'Recent'}
                          </td>
                          <td className="p-3 text-mutedText font-medium">{cust.deletedBy || 'Admin'}</td>
                          <td className="p-3">{getAccountStatusBadge(cust)}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-bold text-primaryText">{cust.subscriptionPlan}</td>
                          <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(cust.mrr)}
                          </td>
                          <td className="p-3 font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cust.subscriptionStatus === 'Active'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {cust.subscriptionStatus || 'Active'}
                            </span>
                          </td>
                          <td className="p-3">{getAccountStatusBadge(cust)}</td>
                          <td className="p-3 text-mutedText font-medium">{formatDate(cust.joinedDate)}</td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/admin/customers/${cust.id}`}>
                            <Button variant="outline" size="sm" leftIcon={<Eye className="w-3 h-3" />}>
                              View
                            </Button>
                          </Link>

                          {activeTab === 'active' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Ban className="w-3 h-3 text-amber-500" />}
                                onClick={() => setSuspendTarget(cust)}
                                className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                              >
                                Suspend
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Trash2 className="w-3 h-3 text-rose-500" />}
                                onClick={() => setDeleteTarget(cust)}
                                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
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
                                leftIcon={<RotateCcw className="w-3 h-3" />}
                                onClick={() => setRestoreTarget(cust)}
                              >
                                Restore
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Trash2 className="w-3 h-3 text-rose-500" />}
                                onClick={() => setDeleteTarget(cust)}
                                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                              >
                                Delete
                              </Button>
                            </>
                          )}

                          {activeTab === 'deleted' && (
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<RotateCcw className="w-3 h-3" />}
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
