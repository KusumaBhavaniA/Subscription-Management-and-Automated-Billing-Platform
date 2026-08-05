import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { AlertCircle, Save, Trash2 } from 'lucide-react';

interface UnsavedChangesContextType {
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  registerSaveHandler: (fn: (() => Promise<boolean | void> | boolean | void) | null) => void;
  registerDiscardHandler: (fn: (() => void) | null) => void;
  requestNavigation: (action: () => void) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export const UnsavedChangesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveHandlerRef = useRef<(() => Promise<boolean | void> | boolean | void) | null>(null);
  const discardHandlerRef = useRef<(() => void) | null>(null);

  // Browser reload / tab close listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Do you want to save before leaving?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const registerSaveHandler = (fn: (() => Promise<boolean | void> | boolean | void) | null) => {
    saveHandlerRef.current = fn;
  };

  const registerDiscardHandler = (fn: (() => void) | null) => {
    discardHandlerRef.current = fn;
  };

  const requestNavigation = (action: () => void) => {
    if (!isDirty) {
      action();
    } else {
      setPendingAction(() => action);
      setShowModal(true);
    }
  };

  const handleModalSave = async () => {
    setIsSaving(true);
    try {
      if (saveHandlerRef.current) {
        await saveHandlerRef.current();
      }
      setIsDirty(false);
      setShowModal(false);
      const action = pendingAction;
      setPendingAction(null);
      if (action) action();
    } catch (err) {
      console.error('Save failed on navigation:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalDiscard = () => {
    if (discardHandlerRef.current) {
      discardHandlerRef.current();
    }
    setIsDirty(false);
    setShowModal(false);
    const action = pendingAction;
    setPendingAction(null);
    if (action) action();
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setPendingAction(null);
  };

  return (
    <UnsavedChangesContext.Provider
      value={{
        isDirty,
        setIsDirty,
        registerSaveHandler,
        registerDiscardHandler,
        requestNavigation,
      }}
    >
      {children}

      {/* LEAVE PAGE CONFIRMATION MODAL */}
      <Modal isOpen={showModal} onClose={handleModalCancel} title="Unsaved Changes" maxWidth="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 text-xs leading-relaxed font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">You have unsaved changes.</p>
              <p className="mt-1 text-[#64748B] dark:text-[#94A3B8] font-medium">Do you want to save before leaving this page?</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
            <Button variant="outline" size="sm" onClick={handleModalCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleModalDiscard}
              disabled={isSaving}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleModalSave}
              isLoading={isSaving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </UnsavedChangesContext.Provider>
  );
};

export const useUnsavedChanges = (): UnsavedChangesContextType => {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChanges must be used within an UnsavedChangesProvider');
  }
  return context;
};
