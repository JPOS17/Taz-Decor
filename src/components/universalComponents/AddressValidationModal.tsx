import { FaCheckCircle, FaExclamationTriangle, FaTimes } from "react-icons/fa";
import type { AddressValidationResult } from "../../api/checkout";
import "../../styles/components/universal/Address.css";

interface AddressValidationModalProps {
  validationResult: AddressValidationResult;
  onAcceptOriginal: () => void;
  onAcceptCorrected: () => void;
  onCancel: () => void;
}

const AddressValidationModal = ({
  validationResult,
  onAcceptOriginal,
  onAcceptCorrected,
  onCancel,
}: AddressValidationModalProps) => {
  const { is_valid, validation_results, original_address, validated_address } =
    validationResult;

  const originalStreet1 =
    original_address.street1 || (original_address as any).address_line1 || "";
  const originalStreet2 =
    original_address.street2 || (original_address as any).address_line2 || "";
  const originalCity = original_address.city;
  const originalState = original_address.state;
  const originalZip = original_address.zip;

  const hasCorrections =
    validated_address &&
    (validated_address.street1 !== originalStreet1 ||
      validated_address.city !== originalCity ||
      validated_address.state !== originalState ||
      validated_address.zip !== originalZip);

  return (
    <div className="avm-overlay">
      <div className="avm-modal">
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
          {/* Valid, no corrections */}
          {is_valid && !hasCorrections && (
            <div className="avm-validation-success">
              <p>Your address has been verified successfully!</p>
            </div>
          )}

          {/* Valid, with corrections */}
          {is_valid && hasCorrections && (
            <div className="avm-validation-correction">
              <p className="avm-correction-notice">
                We found a suggested correction for your address:
              </p>
              <div className="avm-address-comparison">
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

          {/* Invalid */}
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

        <div className="avm-actions">
          {is_valid && !hasCorrections && (
            <button className="avm-btn-accept" onClick={onAcceptOriginal}>
              Continue
            </button>
          )}

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
