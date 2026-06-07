import {
  FaShoppingCart,
  FaMapMarkerAlt,
  FaCreditCard,
  FaCheckCircle,
} from "react-icons/fa";
import "../../../styles/components/customerInterface/checkout/StepIndicator.css";

type CheckoutStep = "cart" | "shipping" | "payment" | "review" | "success";

interface StepIndicatorProps {
  currentStep: CheckoutStep;
}

// Displays the current step in the checkout process with icons and labels
const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const steps: { key: CheckoutStep; label: string; icon: any }[] = [
    { key: "cart", label: "Cart", icon: FaShoppingCart },
    { key: "shipping", label: "Shipping", icon: FaMapMarkerAlt },
    { key: "payment", label: "Payment", icon: FaCreditCard },
    { key: "review", label: "Review", icon: FaCheckCircle },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="si-steps">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = currentStep === step.key;
        const isCompleted = index < currentStepIndex;

        return (
          <div
            key={step.key}
            className={[
              "si-step",
              isActive ? "si-step--active" : "",
              isCompleted ? "si-step--completed" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="si-icon">
              <StepIcon />
            </div>
            <span className="si-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
