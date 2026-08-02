import React from 'react';
import { Search, X, ChevronRight, LayoutDashboard, CreditCard, FileText, DollarSign, BarChart2, Settings, User, Users, Layers, PieChart, HelpCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useSearch, SearchResult } from '../../hooks/useSearch';
import { useUnsavedChanges } from '../../contexts/UnsavedChangesContext';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
  CreditCard: <CreditCard className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  DollarSign: <DollarSign className="w-4 h-4" />,
  BarChart2: <BarChart2 className="w-4 h-4" />,
  Settings: <Settings className="w-4 h-4" />,
  User: <User className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  PieChart: <PieChart className="w-4 h-4" />,
  HelpCircle: <HelpCircle className="w-4 h-4" />,
};

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { query, setQuery, filteredResults, selectResult } = useSearch();
  const { requestNavigation } = useUnsavedChanges();

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-5 h-5 text-mutedText" />
          <input
            type="text"
            autoFocus
            placeholder="Search pages, customers, invoices, subscriptions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-input border border-border rounded-xl text-primaryText text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-mutedText"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 text-mutedText hover:text-primaryText"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-mutedText text-sm">
              No matching pages found for "<span className="font-semibold text-heading">{query}</span>"
            </div>
          ) : (
            filteredResults.map((item: SearchResult) => (
              <button
                key={item.id}
                onClick={() => {
                  onClose();
                  requestNavigation(() => {
                    selectResult(item);
                  });
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary text-secondaryText group-hover:bg-primary group-hover:text-white transition-colors">
                    {iconMap[item.iconName] || <Search className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-heading group-hover:text-primary transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-secondaryText font-medium">{item.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-secondary text-mutedText">
                    {item.category}
                  </span>
                  <ChevronRight className="w-4 h-4 text-mutedText group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
