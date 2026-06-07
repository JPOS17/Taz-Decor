import "../../styles/components/universal/LoadingSpinner.css";

interface LoadingSpinnerProps {
  message?: string;
}

// Shared full-page loading indicator; message defaults to "Loading..." if omitted
const LoadingSpinner = ({ message = "Loading..." }: LoadingSpinnerProps) => {
  return (
    <div className="spinner-wrapper">
      <div className="spinner-ring"></div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
