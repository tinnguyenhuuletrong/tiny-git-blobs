import React from "react";
import { Button } from "./ui/button";
import { useAppContext } from "../context/AppContext";

interface PreviewModalProps {
  open: boolean;
  filePath: string | null;
  content: string | null;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  filePath,
  content,
  onClose,
}) => {
  const { dispatch } = useAppContext();

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-lg p-4 w-full max-w-md mx-2 flex flex-col gap-4">
        <div className="font-semibold text-base mb-2">{filePath}</div>
        <div className="bg-muted rounded p-2 overflow-x-auto max-h-64">
          <pre className="text-xs whitespace-pre-wrap break-all">{content}</pre>
        </div>
        <Button className="self-end mt-2" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};
