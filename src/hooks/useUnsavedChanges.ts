import { useState } from 'react';

// Custom hook to manage unsaved changes state and provide a confirmation flow for navigating away with unsaved changes
export function useUnsavedChanges() {

  const [showModal, setShowModal] = useState(false);
  
  // Stores the navigation function to execute if the user confirms discard
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Checks for unsaved changes and either shows the confirmation modal or executes navigation immediately
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

  // Executes the stored navigation function and closes the modal
  const confirmDiscard = () => {
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
    setShowModal(false);
  };

  // Clears the stored navigation function and closes the modal without navigating
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
