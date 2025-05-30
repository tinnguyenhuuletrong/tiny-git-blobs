import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { ITree, ICommit } from "../types";

interface SnapshotContextProps {
  tree: ITree | null;
  setTree: (tree: ITree) => void;
  commits: ICommit[];
  setCommits: (commits: ICommit[]) => void;
  isHistoryModalOpen: boolean;
  setHistoryModalOpen: (open: boolean) => void;
  previewFilePath: string | null;
  setPreviewFilePath: (filePath: string | null) => void;
  previewContent: string | null;
  setPreviewContent: (content: string | null) => void;
}

const SnapshotContext = createContext<SnapshotContextProps | undefined>(
  undefined
);

export const useSnapshotContext = () => {
  const ctx = useContext(SnapshotContext);
  if (!ctx)
    throw new Error("useSnapshotContext must be used within SnapshotProvider");
  return ctx;
};

export const SnapshotProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tree, setTree] = useState<ITree | null>(null);
  const [commits, setCommits] = useState<ICommit[]>([]);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [previewFilePath, setPreviewFilePath] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  return (
    <SnapshotContext.Provider
      value={{
        tree,
        setTree,
        commits,
        setCommits,
        isHistoryModalOpen,
        setHistoryModalOpen,
        previewFilePath,
        setPreviewFilePath,
        previewContent,
        setPreviewContent,
      }}
    >
      {children}
    </SnapshotContext.Provider>
  );
};
