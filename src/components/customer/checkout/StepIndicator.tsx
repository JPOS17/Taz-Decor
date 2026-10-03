import {
  FaShoppingCart,
  FaMapMarkerAlt,
  FaCreditCard,
  FaCheckCircle,
  FaCheck,
} from "react-icons/fa";
import type { IconType } from "react-icons";

type CheckoutStep = "cart" | "shipping" | "payment" | "review" | "success";

interface StepIndicatorProps {
  currentStep: CheckoutStep;
}

const STEPS: { key: CheckoutStep; label: string; icon: IconType }[] = [
  { key: "cart", label: "Cart", icon: FaShoppingCart },
  { key: "shipping", label: "Shipping", icon: FaMapMarkerAlt },
  { key: "payment", label: "Payment", icon: FaCreditCard },
  { key: "review", label: "Review", icon: FaCheckCircle },
];

// Displays the current step in the checkout process with icons and labels.
// Completed steps swap their icon for a check mark.
const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <nav aria-label="Checkout progress">
      <ol className="step-indicator-steps">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.key;
          const isCompleted = index < currentStepIndex;

          return (
            <li
              key={step.key}
              className={[
                "step-indicator-step",
                isActive ? "step-indicator-step--active" : "",
                isCompleted ? "step-indicator-step--completed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="step-indicator-icon" aria-hidden="true">
                {isCompleted ? <FaCheck /> : <StepIcon />}
              </span>
              <span className="step-indicator-label">{step.label}</span>
              {isCompleted && (
                <span className="step-indicator-sr-only"> (completed)</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepIndicator;