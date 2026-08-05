import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  isVisible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  isVisible,
  message,
  type = 'success',
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border border-border bg-card text-primaryText min-w-[280px]"
        >
          {type === 'success' && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
          {type === 'error' && <AlertCircle className="w-5 h-5 text-danger shrink-0" />}
          {type === 'info' && <Info className="w-5 h-5 text-primary shrink-0" />}
          <span className="text-sm font-semibold flex-1">{message}</span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-mutedText hover:text-primaryText transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
