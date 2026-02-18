import { useState } from 'react';

interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
}

export function useConfirmationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmationConfig | null>(null);

  const showConfirmation = (newConfig: ConfirmationConfig) => {
    setConfig(newConfig);
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    if (config?.onConfirm) {
      await config.onConfirm();
    }
    setIsOpen(false);
  };

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