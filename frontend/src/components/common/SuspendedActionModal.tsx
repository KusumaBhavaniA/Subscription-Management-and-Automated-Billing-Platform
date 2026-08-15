import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Headphones } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface SuspendedActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const SuspendedActionModal: React.FC<SuspendedActionModalProps> = ({
  isOpen,
  onClose,
  message = 'Your account is currently suspended. Subscription purchases and payments are disabled. Please contact Support to request restoration.',
}) => {
  const navigate = useNavigate();

  const handleContactSupport = () => {
    onClose();
    navigate('/customer/support');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Suspended" size="md">
      <div className="space-y-4 text-xs">
        <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-secondaryText leading-relaxed font-semibold">
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleContactSupport}
            leftIcon={<Headphones className="w-4 h-4" />}
            className="bg-amber-600 hover:bg-amber-700 text-white border-none cursor-pointer"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </Modal>
  );
};
