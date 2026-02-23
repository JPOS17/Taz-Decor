import "../../styles/components/universal/LoadingSpinner.css";

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner = ({ message = "Loading..." }: LoadingSpinnerProps) => {
  return (
    <div className="universal-loading-wrapper">
      <div className="universal-spinner"></div>
      {message && <p className="universal-loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
