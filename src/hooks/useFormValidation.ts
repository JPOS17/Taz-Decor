import { useState, useEffect, useRef } from 'react';
import type { ValidationErrors } from '../utils/formValidator';

// Custom hook to manage form validation state based on form data and a validation function
export function useFormValidation<T>(
  formData: T,
  validationFn: (data: T, additionalState?: any) => ValidationErrors,
  hasAttemptedSubmit: boolean,
  additionalState?: any
) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Refs to hold the latest validation function and additional state without causing re-renders
  const validationFnRef = useRef(validationFn);
  const additionalStateRef = useRef(additionalState);

  // Keep refs in sync whenever either value changes
  useEffect(() => {
    validationFnRef.current = validationFn;
    additionalStateRef.current = additionalState;
  }, [validationFn, additionalState]);

  // Run validation whenever form data changes and the user has attempted to submit at least once
  useEffect(() => {
    if (hasAttemptedSubmit) {
      const validationErrors = validationFnRef.current(formData, additionalStateRef.current);

      // Only update state when errors actually change to avoid unnecessary re-renders
      setErrors(prevErrors => {
        const errorsChanged = JSON.stringify(prevErrors) !== JSON.stringify(validationErrors);
        return errorsChanged ? validationErrors : prevErrors;
      });
    }
  }, [formData, hasAttemptedSubmit, additionalState]);

  // Removes a specific field error; optionally also clears the shared package_dimensions error
  const clearFieldError = (field: string, clearDimensionError = false) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      if (clearDimensionError) {
        delete newErrors.package_dimensions;
      }
      return newErrors;
    });
  };

  return { errors, setErrors, clearFieldError };
}
