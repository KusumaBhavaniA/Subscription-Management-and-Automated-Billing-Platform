import React, { useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage';
import { Customer } from '../../types/customer';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(() =>
    getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPlan] = useState('Pro Business');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subscriptionPlan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newName,
      email: newEmail,
      phone: newPhone || '+91 9876543210',
      status: 'Active',
      subscriptionPlan: newPlan,
      mrr: newPlan.includes('Pro') ? 4999 : newPlan.includes('Enterprise') ? 14999 : 1999,
      totalSpent: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      country: 'India',
    };

    const updated = [newCust, ...customers];
    setCustomers(updated);
    setItem(STORAGE_KEYS.CUSTOMERS, updated);

    setIsAddModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Customer Directory
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            Manage subscriber accounts, view individual MRR, and track billing history.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Customer
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-mutedText" />
          <input
            type="text"
            placeholder="Search by name, email, or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary font-medium"
          />
        </div>
        <div className="text-xs text-secondaryText font-semibold">
          Showing <span className="text-heading font-extrabold">{filteredCustomers.length}</span> customers
        </div>
      </Card>

      <Card space-y-4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                <th className="p-3 font-semibold">Customer Name</th>
                <th className="p-3 font-semibold">Contact</th>
                <th className="p-3 font-semibold">Plan</th>
                <th className="p-3 font-semibold">MRR</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-tableHover transition-colors">
                  <td className="p-3 font-bold text-heading">{cust.name}</td>
                  <td className="p-3 text-secondaryText font-medium">
                    <div className="font-semibold text-primaryText">{cust.email}</div>
                    <div className="text-[10px] text-mutedText">{cust.phone}</div>
                  </td>
                  <td className="p-3 font-semibold text-primaryText">{cust.subscriptionPlan}</td>
                  <td className="p-3 font-bold text-heading">{formatCurrency(cust.mrr)}</td>
                  <td className="p-3">
                    <Badge variant={cust.status === 'Active' ? 'success' : 'neutral'}>{cust.status}</Badge>
                  </td>
                  <td className="p-3 text-mutedText font-medium">{formatDate(cust.joinedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Customer">
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <Input label="Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          <Input label="Email Address" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          <Input label="Phone Number" type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+91 9876543210" />
          <Button type="submit" variant="primary" className="w-full mt-2">
            Create Customer Profile
          </Button>
        </form>
      </Modal>
    </div>
  );
};
