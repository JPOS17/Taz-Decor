import {
  FaShoppingCart,
  FaMapMarkerAlt,
  FaCreditCard,
  FaCheckCircle,
} from "react-icons/fa";

type CheckoutStep = "cart" | "shipping" | "payment" | "review" | "success";

interface StepIndicatorProps {
  currentStep: CheckoutStep;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const steps: { key: CheckoutStep; label: string; icon: any }[] = [
    { key: "cart", label: "Cart", icon: FaShoppingCart },
    { key: "shipping", label: "Shipping", icon: FaMapMarkerAlt },
    { key: "payment", label: "Payment", icon: FaCreditCard },
    { key: "review", label: "Review", icon: FaCheckCircle },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="cp-checkout-steps">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = currentStep === step.key;
        const isCompleted = index < currentStepIndex;

        return (
          <div
            key={step.key}
            className={`cp-checkout-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
          >
            <div className="cp-step-icon">
              <StepIcon />
            </div>
            <span className="cp-step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
