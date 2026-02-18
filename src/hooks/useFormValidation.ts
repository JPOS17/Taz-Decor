import { useState, useEffect, useRef } from 'react';
import type { ValidationErrors } from '../utils/formValidator';

export function useFormValidation<T>(
  formData: T,
  validationFn: (data: T, additionalState?: any) => ValidationErrors,
  hasAttemptedSubmit: boolean,
  additionalState?: any
) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const validationFnRef = useRef(validationFn);
  const additionalStateRef = useRef(additionalState);
  
  // Update refs when they change
  useEffect(() => {
    validationFnRef.current = validationFn;
    additionalStateRef.current = additionalState;
  }, [validationFn, additionalState]);

  // Run validation when formData or hasAttemptedSubmit changes
  useEffect(() => {
    if (hasAttemptedSubmit) {
      // Pass the latest additionalState to validation function
      const validationErrors = validationFnRef.current(formData, additionalStateRef.current);
      
      setErrors(prevErrors => {
        const errorsChanged = JSON.stringify(prevErrors) !== JSON.stringify(validationErrors);
        return errorsChanged ? validationErrors : prevErrors;
      });
    }
  }, [formData, hasAttemptedSubmit, additionalState]); // Include additionalState to trigger re-validation

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