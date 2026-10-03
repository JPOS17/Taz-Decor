import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ToastNotificationProps {
  message: string;
  type: "success" | "error" | "warning";
}

// Displays a status toast with an icon and message, styled by type
export const ToastNotification = ({
  message,
  type,
}: ToastNotificationProps) => {
  // Returns the appropriate icon based on toast type
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={18} />;
      case "warning":
        return <AlertCircle size={18} />;
      case "error":
        return <XCircle size={18} />;
    }
  };

  // Split message by newlines and render each line
  const messageLines = message.split("\n");

  return (
    <div
      className={`manager-toast-notification manager-toast-notification--${type}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <span className="manager-toast-notification-icon" aria-hidden="true">
        {getIcon()}
      </span>

      {/* Render each line as its own <p> */}
      <div className="manager-toast-notification-content">
        {messageLines.map((line, index) => (
          <p key={index} className="manager-toast-notification-message">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};