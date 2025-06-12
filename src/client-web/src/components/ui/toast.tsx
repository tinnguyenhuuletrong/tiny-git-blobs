import React from "react";
import { createPortal } from "react-dom";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  onClose,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }[type];

  return createPortal(
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300`}
      role="alert"
    >
      {message}
    </div>,
    document.body
  );
};
