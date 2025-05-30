import React from "react";
import { GitHistoryList } from "./GitHistoryList";
import type { ICommit } from "../types";
import { Button } from "./ui/button";
import { useAppContext } from "../context/AppContext";

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  commits: ICommit[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  open,
  onClose,
  commits,
}) => {
  const { dispatch } = useAppContext();

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-lg p-4 w-full max-w-md mx-2 flex flex-col gap-4">
        <div className="flex-1 overflow-y-auto max-h-80">
          <GitHistoryList commits={commits} />
        </div>
        <Button className="self-end mt-2" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};
