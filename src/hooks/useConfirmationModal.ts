import { useState } from 'react';

// Types for the confirmation modal config passed to showConfirmation
interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
}

// Custom hook to manage a confirmation modal's open state and config
export function useConfirmationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmationConfig | null>(null);

  // Stores the config and opens the modal
  const showConfirmation = (newConfig: ConfirmationConfig) => {
    setConfig(newConfig);
    setIsOpen(true);
  };

  // Runs the onConfirm callback (sync or async) then closes the modal
  const handleConfirm = async () => {
    if (config?.onConfirm) {
      await config.onConfirm();
    }
    setIsOpen(false);
  };

  // Closes the modal without running the callback
  const handleCancel = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    config,
    showConfirmation,
    handleConfirm,
    handleCancel,
  };
}
