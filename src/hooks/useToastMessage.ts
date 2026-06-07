import { useState } from "react";

// Types for a toast message — text and severity level
interface Message {
  text: string;
  type: "success" | "error" | "warning";
}

// How long each toast stays visible before auto-dismissing
const TOAST_DURATION_MS = 4000;

// Custom hook to manage a toast message's state and provide functions to show and clear messages
export function useToastMessage() {
  const [message, setMessage] = useState<Message | null>(null);

  // Sets the toast message and schedules it to clear after TOAST_DURATION_MS
  const showMessage = (text: string, type: "success" | "error" | "warning") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), TOAST_DURATION_MS);
  };

  // Immediately clears the toast without waiting for the timer
  const clearMessage = () => setMessage(null);

  return { message, showMessage, clearMessage };
}
