import { useState } from 'react';

export function useUnsavedChanges() {
  const [showModal, setShowModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const checkUnsavedChanges = (
    hasChanges: boolean,
    navigationFn: () => void
  ) => {
    if (hasChanges) {
      setPendingNavigation(() => navigationFn);
      setShowModal(true);
    } else {
      navigationFn();
    }
  };

  const confirmDiscard = () => {
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
    setShowModal(false);
  };

  const cancelDiscard = () => {
    setPendingNavigation(null);
    setShowModal(false);
  };

  return {
    showModal,
    checkUnsavedChanges,
    confirmDiscard,
    cancelDiscard,
  };
}