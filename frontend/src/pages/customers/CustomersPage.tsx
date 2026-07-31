import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, Search, ExternalLink, Eye } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getItem, STORAGE_KEYS } from '../../utils/storage';
import { Customer } from '../../types/customer';
import { CreateCustomerModal } from '../../components/customers/CreateCustomerModal';
import { CustomerDetailsModal } from '../../components/customers/CustomerDetailsModal';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(() =>
    getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const refreshCustomers = () => {
    setCustomers(getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []));
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subscriptionPlan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  const getAccountStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'Verified':
      case 'Active':
        return <Badge variant="success">{status}</Badge>;
      case 'Pending Verification':
      case 'Pending':
        return <Badge variant="warning">{status}</Badge>;
      case 'Suspended':
      case 'Inactive':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
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
            Manage customer accounts, inspect subscription status, and view customer details.
          </p>
        </div>

        {/* STEP 5: Create Customer / Add Customer Button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Create Customer
        </Button>
      </div>

      {/* Search & Counter Bar */}
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
          Showing <span className="text-heading font-extrabold">{filteredCustomers.length}</span> of {customers.length} registered customers
        </div>
      </Card>

      {/* STEP 6: Customer Directory Table */}
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
                <th className="p-3 font-semibold">Sub Status</th>
                <th className="p-3 font-semibold">Account Status</th>
                <th className="p-3 font-semibold">Joined Date</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-mutedText font-medium">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-tableHover transition-colors group">
                    {/* Customer Name -> opens dedicated Customer Details Page */}
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
                    <td className="p-3 font-bold text-primaryText">{cust.subscriptionPlan}</td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(cust.mrr)}
                    </td>
                    <td className="p-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cust.subscriptionStatus === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {cust.subscriptionStatus || (cust.subscriptionPlan === 'None' || cust.subscriptionPlan === 'No Plan' ? 'Inactive' : 'Active')}
                      </span>
                    </td>
                    <td className="p-3">{getAccountStatusBadge(cust.status)}</td>
                    <td className="p-3 text-mutedText font-medium">{formatDate(cust.joinedDate)}</td>
                    <td className="p-3 text-right">
                      <Link to={`/admin/customers/${cust.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-3 h-3" />}
                        >
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* STEP 5: Create Customer Modal */}
      <CreateCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCustomerCreated={(newCust) => {
          refreshCustomers();
          setSelectedCustomer(newCust);
        }}
      />

      {/* STEP 7: Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onCustomerUpdated={refreshCustomers}
        />
      )}
    </div>
  );
};
