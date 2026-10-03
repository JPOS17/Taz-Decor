interface LoadingSpinnerProps {
  message?: string;
}

// Shared loading indicator; message defaults to "Loading..." if omitted.
// Announced to screen readers as a polite status update.
const LoadingSpinner = ({ message = "Loading..." }: LoadingSpinnerProps) => {
  return (
    <div className="loading-spinner-wrapper" role="status" aria-live="polite">
      <div className="loading-spinner-ring" aria-hidden="true"></div>
      {message && <p className="loading-spinner-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;