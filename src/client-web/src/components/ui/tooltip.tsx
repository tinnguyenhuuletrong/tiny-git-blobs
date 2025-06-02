import React from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <span
      title={content}
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      {children}
    </span>
  );
};
