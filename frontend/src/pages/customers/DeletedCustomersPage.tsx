import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Search, UserCheck } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Toast } from '../../components/common/Toast';
import { getItem, STORAGE_KEYS } from '../../utils/storage';
import { Customer } from '../../types/customer';
import { formatDate } from '../../utils/formatters';
import { customerApi } from '../../services/api/customerApi';

export const DeletedCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadDeletedCustomers = async () => {
    setIsLoading(true);
    try {
      const list = await customerApi.getCustomers('deleted');
      setCustomers(list);
    } catch (err) {
      console.error('Failed to load deleted customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedCustomers();
  }, []);

  const filteredDeleted = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.customerId && c.customerId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRestore = async (customer: Customer) => {
    try {
      await customerApi.restoreCustomer(customer.id || customer.customerId || customer.email);
      setToastMsg('Customer account restored successfully.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      await loadDeletedCustomers();
    } catch (err) {
      console.error('Failed to restore customer:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-rose-500" />
          Deleted Customer Accounts
        </h1>
        <p className="text-xs text-secondaryText mt-1">
          Archive of soft-deleted customer accounts. Restoring an account moves it back to active status and enables customer portal login.
        </p>
      </div>

      {/* Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-mutedText" />
          <input
            type="text"
            placeholder="Search deleted customer name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25 font-medium"
          />
        </div>
        <div className="text-xs text-secondaryText font-semibold">
          Showing <span className="text-heading font-extrabold">{filteredDeleted.length}</span> of {customers.length} deleted accounts
        </div>
      </Card>

      {/* Deleted Customers Table */}
      <Card space-y-4>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-xs text-secondaryText mt-3 font-semibold">Loading deleted customers...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                  <th className="p-3 font-semibold">Customer Name</th>
                  <th className="p-3 font-semibold">Customer ID</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Mobile</th>
                  <th className="p-3 font-semibold">Account Creation Date</th>
                  <th className="p-3 font-semibold">Deleted Date</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDeleted.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-mutedText">
                      <div className="space-y-2 max-w-sm mx-auto">
                        <UserCheck className="w-8 h-8 text-mutedText mx-auto opacity-60" />
                        <p className="text-sm font-bold text-heading">No deleted customer accounts</p>
                        <p className="text-xs text-secondaryText">There are currently no soft-deleted customer accounts in the archive.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDeleted.map((cust) => (
                    <tr key={cust.id} className="hover:bg-tableHover transition-colors">
                      <td className="p-3 font-bold text-heading">{cust.name}</td>
                      <td className="p-3 font-mono font-bold text-primary">{cust.customerId || cust.id}</td>
                      <td className="p-3 text-secondaryText font-medium">{cust.email}</td>
                      <td className="p-3 text-secondaryText font-medium">{cust.phone || 'N/A'}</td>
                      <td className="p-3 text-mutedText font-medium">{formatDate(cust.joinedDate || cust.registrationDate || '')}</td>
                      <td className="p-3 text-mutedText font-mono">{cust.deletedAt ? formatDate(cust.deletedAt) : 'Recently'}</td>
                      <td className="p-3">
                        <Badge variant="danger">DELETED</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-emerald-500" />}
                          onClick={() => handleRestore(cust)}
                        >
                          Restore
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Toast
        isVisible={showToast}
        message={toastMsg}
        type="success"
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};
