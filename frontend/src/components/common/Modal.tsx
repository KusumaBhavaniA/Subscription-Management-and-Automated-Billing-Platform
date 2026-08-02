import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth,
  size,
}) => {
  const effectiveWidth = size || maxWidth || 'md';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Width classes matching 700-850px desktop standards for lg/xl
  const widthClasses = {
    sm: 'max-w-sm w-full',
    md: 'max-w-md w-full',
    lg: 'max-w-xl w-[90%]',
    xl: 'max-w-3xl w-[90%] md:w-[750px] lg:w-[820px]',
    '2xl': 'max-w-4xl w-[95%]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          {/* Fixed Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Centered Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`relative flex flex-col ${widthClasses[effectiveWidth]} max-h-[85vh] rounded-2xl z-10 bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] shadow-[0_20px_50px_rgba(15,23,42,0.22)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-[#0F172A] dark:text-[#F8FAFC] overflow-hidden`}
          >
            {/* Sticky Header */}
            {title && (
              <div className="sticky top-0 z-20 px-6 py-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#334155] flex items-start justify-between gap-4 shrink-0">
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-medium leading-normal">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer shrink-0"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Scrollable Body Only */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
