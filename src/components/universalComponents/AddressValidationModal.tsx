import { FaCheckCircle, FaExclamationTriangle, FaTimes } from "react-icons/fa";
import type { AddressValidationResult } from "../../api/checkout";
import "../../styles/components/universal/AddressValidationModal.css";

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

  // The backend returns original_address with street1/street2 format
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
    <div className="modal-overlay">
      <div className="validation-modal">
        <div className="modal-header">
          <h3>
            {is_valid ? (
              <>
                <FaCheckCircle color="#10b981" /> Address Validation
              </>
            ) : (
              <>
                <FaExclamationTriangle color="#f59e0b" /> Address Issue Detected
              </>
            )}
          </h3>
          <button className="modal-close" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {is_valid && !hasCorrections && (
            <div className="validation-success">
              <p>✅ Your address has been validated successfully!</p>
            </div>
          )}

          {is_valid && hasCorrections && (
            <div className="validation-correction">
              <p className="correction-notice">
                We found a suggested correction for your address:
              </p>

              <div className="address-comparison">
                <div className="address-column">
                  <h4>You Entered:</h4>
                  <div className="address-box original">
                    <p>{originalStreet1}</p>
                    {originalStreet2 && <p>{originalStreet2}</p>}
                    <p>
                      {originalCity}, {originalState} {originalZip}
                    </p>
                  </div>
                </div>

                <div className="address-column">
                  <h4>Suggested:</h4>
                  <div className="address-box corrected">
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

          {!is_valid && (
            <div className="validation-error">
              <p className="error-notice">
                ⚠️ We couldn't verify this address. Please review:
              </p>
              {validation_results.messages.length > 0 && (
                <ul className="validation-messages">
                  {validation_results.messages.map((msg, idx) => (
                    <li key={idx}>{msg.text || "Validation issue detected"}</li>
                  ))}
                </ul>
              )}
              <div className="address-box original">
                <p>{originalStreet1}</p>
                {originalStreet2 && <p>{originalStreet2}</p>}
                <p>
                  {originalCity}, {originalState} {originalZip}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          {is_valid && !hasCorrections && (
            <button className="btn-accept" onClick={onAcceptOriginal}>
              Continue
            </button>
          )}

          {is_valid && hasCorrections && (
            <>
              <button
                className="btn-accept-original"
                onClick={onAcceptOriginal}
              >
                Use Original Address
              </button>
              <button
                className="btn-accept-corrected"
                onClick={onAcceptCorrected}
              >
                Use Suggested Address
              </button>
            </>
          )}

          {!is_valid && (
            <>
              <button className="btn-cancel" onClick={onCancel}>
                Go Back & Edit
              </button>
              <button className="btn-accept-anyway" onClick={onAcceptOriginal}>
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
