import React from 'react';
import { Modal } from '../common/Modal';
import { PaymentTransaction } from '../../types/payment';
import { PaymentEventChip } from './PaymentEventChip';
import { formatDate } from '../../utils/formatters';

interface DayPaymentsModalProps {
  isOpen: boolean;
  dateStr: string | null;
  payments: PaymentTransaction[];
  onClose: () => void;
  onSelectPayment: (payment: PaymentTransaction) => void;
}

export const DayPaymentsModal: React.FC<DayPaymentsModalProps> = ({
  isOpen,
  dateStr,
  payments,
  onClose,
  onSelectPayment,
}) => {
  if (!dateStr) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transactions on ${formatDate(dateStr)}`}
      description={`${payments.length} customer payment ${payments.length === 1 ? 'record' : 'records'} logged.`}
      size="md"
    >
      <div className="space-y-2.5">
        {payments.map((p) => (
          <div key={p.id} onClick={() => {
            onClose();
            onSelectPayment(p);
          }}>
            <PaymentEventChip payment={p} onClick={() => {
              onClose();
              onSelectPayment(p);
            }} />
          </div>
        ))}
      </div>
    </Modal>
  );
};
