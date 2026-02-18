import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ToastNotificationProps {
  message: string;
  type: "success" | "error" | "warning";
}

export const ToastNotification = ({
  message,
  type,
}: ToastNotificationProps) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="toast-icon success" size={24} />;
      case "warning":
        return <AlertCircle className="toast-icon warning" size={24} />;
      case "error":
        return <XCircle className="toast-icon error" size={24} />;
    }
  };

  // Split message by newlines and render each line
  const messageLines = message.split("\n");

  return (
    <div className={`toast-notification ${type}`}>
      {getIcon()}
      <div className="toast-content">
        {messageLines.map((line, index) => (
          <p
            key={index}
            className="toast-message"
            style={{ margin: index > 0 ? "0.25rem 0 0 0" : "0" }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};
