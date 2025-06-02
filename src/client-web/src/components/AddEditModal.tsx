import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useAppContext } from "../context/AppContext";

interface AddEditModalProps {
  open: boolean;
  mode: "add" | "edit";
  fileName: string;
  fileContent: string;
  onSave: (fileName: string, fileContent: string) => void;
  onClose: () => void;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({
  open,
  mode,
  fileName: initialFileName,
  fileContent: initialFileContent,
  onSave,
  onClose,
}) => {
  const [fileName, setFileName] = useState(initialFileName);
  const [fileContent, setFileContent] = useState(initialFileContent);

  // Update local state when props change (e.g., when switching between add/edit modes)
  useEffect(() => {
    setFileName(initialFileName);
    setFileContent(initialFileContent);
  }, [initialFileName, initialFileContent]);

  if (!open) return null;

  const handleSave = () => {
    onSave(fileName, fileContent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-lg p-4 w-full max-w-md mx-2 flex flex-col gap-4">
        <div className="font-semibold text-base mb-2">
          {mode === "add" ? "Add New File" : `Edit File: ${fileName}`}
        </div>
        <input
          className="border rounded p-2 text-sm"
          type="text"
          placeholder="File name"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          disabled={mode === "edit"}
        />
        <textarea
          className="border rounded p-2 text-sm min-h-[120px]"
          placeholder="File content"
          value={fileContent}
          onChange={(e) => setFileContent(e.target.value)}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={!fileName || !fileContent}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
