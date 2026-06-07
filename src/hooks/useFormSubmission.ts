import { useEffect } from 'react';

interface UseFormSubmissionProps<T> {
  formData: T;
  additionalDeps: any[];
  executeSubmit: () => void;
  functionName: string;
}

// Custom hook to expose a form submission function globally for external triggers
export function useFormSubmission<T>({
  formData,
  additionalDeps,
  executeSubmit,
  functionName,
}: UseFormSubmissionProps<T>) {
  useEffect(() => {
    (window as any)[functionName] = executeSubmit;
    return () => {
      delete (window as any)[functionName];
    };
  }, [formData, ...additionalDeps, executeSubmit, functionName]);
}
