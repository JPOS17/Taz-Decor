import { useEffect, useId, useRef } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaTimes } from "react-icons/fa";
import type { AddressValidationResult } from "../../api/checkout";

interface AddressValidationModalProps {
  validationResult: AddressValidationResult;
  onAcceptOriginal: () => void;
  onAcceptCorrected: () => void;
  onCancel: () => void;
}

// Modal shown after USPS address validation during checkout
const AddressValidationModal = ({
  validationResult,
  onAcceptOriginal,
  onAcceptCorrected,
  onCancel,
}: AddressValidationModalProps) => {
  const { is_valid, validation_results, original_address, validated_address } =
    validationResult;

  const titleId = useId();
  // The first action button receives focus when the dialog opens
  const actionsRef = useRef<HTMLDivElement>(null);

  // While open: focus the first action, lock page scroll, and let Escape cancel.
  // Escape is caught in the capture phase and stopped, so a modal underneath
  // (such as the address form) doesn't also close.
  useEffect(() => {
    actionsRef.current?.querySelector("button")?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onCancel();
    };
    window.addEventListener("keydown", handleKeyDown, true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel]);

  // Normalize street fields — API may return street1 or address_line1 depending on the source
  const originalStreet1 =
    original_address.street1 || (original_address as any).address_line1 || "";
  const originalStreet2 =
    original_address.street2 || (original_address as any).address_line2 || "";
  const originalCity = original_address.city;
  const originalState = original_address.state;
  const originalZip = original_address.zip;

  // True when USPS returned a validated address that differs from what the user entered
  const hasCorrections =
    validated_address &&
    (validated_address.street1 !== originalStreet1 ||
      validated_address.city !== originalCity ||
      validated_address.state !== originalState ||
      validated_address.zip !== originalZip);

  return (
    <div className="address-validation-modal-overlay">
      <div
        className="address-validation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className="address-validation-modal-header">
          <h2 id={titleId} className="address-validation-modal-title">
            {is_valid ? (
              <>
                <FaCheckCircle
                  className="address-validation-modal-header-icon-success"
                  aria-hidden="true"
                />{" "}
                Address Verification
              </>
            ) : (
              <>
                <FaExclamationTriangle
                  className="address-validation-modal-header-icon-warning"
                  aria-hidden="true"
                />{" "}
                Address Issue Detected
              </>
            )}
          </h2>
          <button
            type="button"
            className="address-validation-modal-close"
            onClick={onCancel}
            aria-label="Close address verification"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <div className="address-validation-modal-body">
          {/* State 1: valid, no corrections needed */}
          {is_valid && !hasCorrections && (
            <div className="address-validation-modal-validation-success">
              <p>Your address has been verified successfully!</p>
            </div>
          )}

          {/* State 2: valid, but USPS suggests a correction — shows a side-by-side comparison */}
          {is_valid && hasCorrections && (
            <div className="address-validation-modal-validation-correction">
              <p className="address-validation-modal-correction-notice">
                We found a suggested correction for your address:
              </p>
              <div className="address-validation-modal-address-comparison">
                {/* Original address as entered by the user */}
                <div className="address-validation-modal-address-column">
                  <h3>You Entered</h3>
                  <div className="address-validation-modal-address-box address-validation-modal-address-box-original">
                    <p>{originalStreet1}</p>
                    {originalStreet2 && <p>{originalStreet2}</p>}
                    <p>
                      {originalCity}, {originalState} {originalZip}
                    </p>
                  </div>
                </div>

                {/* USPS-corrected address */}
                <div className="address-validation-modal-address-column">
                  <h3>Suggested</h3>
                  <div className="address-validation-modal-address-box address-validation-modal-address-box-corrected">
                    <p>{validated_address.street1}</p>
                    {validated_address.street2 && (
                      <p>{validated_address.street2}</p>
                    )}
                    <p>
                      {validated_address.city}, {validated_address.state}{" "}
                      {validated_address.zip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* State 3: invalid — shows USPS error messages and the address as entered */}
          {!is_valid && (
            <div className="address-validation-modal-validation-error" role="alert">
              <p className="address-validation-modal-error-notice">
                We couldn't verify this address. Please review your address
                before continuing!
              </p>
              {validation_results.messages.length > 0 && (
                <ul className="address-validation-modal-validation-messages">
                  {validation_results.messages.map((msg, idx) => (
                    <li key={idx}>{msg.text || "Validation issue detected"}</li>
                  ))}
                </ul>
              )}
              <div className="address-validation-modal-address-box address-validation-modal-address-box-original">
                <p>{originalStreet1}</p>
                {originalStreet2 && <p>{originalStreet2}</p>}
                <p>
                  {originalCity}, {originalState} {originalZip}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="address-validation-modal-actions" ref={actionsRef}>
          {/* Valid, no corrections — single continue button */}
          {is_valid && !hasCorrections && (
            <button type="button" className="address-validation-modal-btn-accept" onClick={onAcceptOriginal}>
              Continue
            </button>
          )}

          {/* Valid, with corrections — let the user choose which address to use */}
          {is_valid && hasCorrections && (
            <>
              <button
                type="button"
                className="address-validation-modal-btn-accept-original"
                onClick={onAcceptOriginal}
              >
                Use Original Address
              </button>
              <button
                type="button"
                className="address-validation-modal-btn-accept-corrected"
                onClick={onAcceptCorrected}
              >
                Use Suggested Address
              </button>
            </>
          )}

          {/* Invalid — allow going back to edit or saving as-is */}
          {!is_valid && (
            <>
              <button type="button" className="address-validation-modal-btn-cancel" onClick={onCancel}>
                Go Back & Edit
              </button>
              <button
                type="button"
                className="address-validation-modal-btn-accept-anyway"
                onClick={onAcceptOriginal}
              >
                Save Anyway
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressValidationModal;