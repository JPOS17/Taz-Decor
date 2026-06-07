import { FaCheckCircle, FaExclamationTriangle, FaTimes } from "react-icons/fa";
import type { AddressValidationResult } from "../../api/checkout";
import "../../styles/components/universal/Address.css";

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
    <div className="avm-overlay">
      <div className="avm-modal">
        {/* Header — icon and title reflect validation outcome */}
        <div className="avm-header">
          <h3>
            {is_valid ? (
              <>
                <FaCheckCircle className="avm-header-icon-success" /> Address
                Verification
              </>
            ) : (
              <>
                <FaExclamationTriangle className="avm-header-icon-warning" />{" "}
                Address Issue Detected
              </>
            )}
          </h3>
          <button className="avm-close" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>

        <div className="avm-body">
          {/* State 1: valid, no corrections needed */}
          {is_valid && !hasCorrections && (
            <div className="avm-validation-success">
              <p>Your address has been verified successfully!</p>
            </div>
          )}

          {/* State 2: valid, but USPS suggests a correction — shows a side-by-side comparison */}
          {is_valid && hasCorrections && (
            <div className="avm-validation-correction">
              <p className="avm-correction-notice">
                We found a suggested correction for your address:
              </p>
              <div className="avm-address-comparison">
                {/* Original address as entered by the user */}
                <div className="avm-address-column">
                  <h4>You Entered:</h4>
                  <div className="avm-address-box avm-address-box-original">
                    <p>{originalStreet1}</p>
                    {originalStreet2 && <p>{originalStreet2}</p>}
                    <p>
                      {originalCity}, {originalState} {originalZip}
                    </p>
                  </div>
                </div>

                {/* USPS-corrected address */}
                <div className="avm-address-column">
                  <h4>Suggested:</h4>
                  <div className="avm-address-box avm-address-box-corrected">
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
            <div className="avm-validation-error">
              <p className="avm-error-notice">
                We couldn't verify this address. Please review your address
                before continuing!
              </p>
              {validation_results.messages.length > 0 && (
                <ul className="avm-validation-messages">
                  {validation_results.messages.map((msg, idx) => (
                    <li key={idx}>{msg.text || "Validation issue detected"}</li>
                  ))}
                </ul>
              )}
              <div className="avm-address-box avm-address-box-original">
                <p>{originalStreet1}</p>
                {originalStreet2 && <p>{originalStreet2}</p>}
                <p>
                  {originalCity}, {originalState} {originalZip}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions — buttons rendered conditionally based on validation state */}
        <div className="avm-actions">
          {/* Valid, no corrections — single continue button */}
          {is_valid && !hasCorrections && (
            <button className="avm-btn-accept" onClick={onAcceptOriginal}>
              Continue
            </button>
          )}

          {/* Valid, with corrections — let the user choose which address to use */}
          {is_valid && hasCorrections && (
            <>
              <button
                className="avm-btn-accept-original"
                onClick={onAcceptOriginal}
              >
                Use Original Address
              </button>
              <button
                className="avm-btn-accept-corrected"
                onClick={onAcceptCorrected}
              >
                Use Suggested Address
              </button>
            </>
          )}

          {/* Invalid — allow going back to edit or saving as-is */}
          {!is_valid && (
            <>
              <button className="avm-btn-cancel" onClick={onCancel}>
                Go Back & Edit
              </button>
              <button
                className="avm-btn-accept-anyway"
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
