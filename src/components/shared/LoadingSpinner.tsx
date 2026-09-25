interface LoadingSpinnerProps {
  message?: string;
}

// Shared full-page loading indicator; message defaults to "Loading..." if omitted
const LoadingSpinner = ({ message = "Loading..." }: LoadingSpinnerProps) => {
  return (
    <div className="loading-spinner-wrapper">
      <div className="loading-spinner-ring"></div>
      {message && <p className="loading-spinner-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
