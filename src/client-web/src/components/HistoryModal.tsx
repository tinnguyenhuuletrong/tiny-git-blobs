import React, { useState, useEffect } from "react";
import { GitHistoryList } from "./GitHistoryList";
import type { ICommit, ITree } from "../types";
import { Button } from "./ui/button";
import { useAppContext } from "../context/AppContext";
import { SnapshotTreePreview } from "./SnapshotTreePreview";
import { downloadBlobData } from "@/lib/appLogic";
import { saveArrayBuffer } from "@/lib/utils";
import { PreviewModal } from "./PreviewModal";

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
  const { state } = useAppContext();
  const [selectedCommit, setSelectedCommit] = useState<ICommit | null>(null);
  const [selectedTree, setSelectedTree] = useState<ITree | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    path: string;
    hash: string;
  } | null>(null);

  useEffect(() => {
    const fetchTree = async () => {
      if (!selectedCommit) {
        setSelectedTree(null);
        return;
      }

      setIsLoading(true);
      try {
        const storage = state.core.storage;
        if (!storage) {
          throw new Error("Storage not initialized");
        }
        const tree = await storage.getTree(selectedCommit.content.tree_hash);
        setSelectedTree(tree);
      } catch (error) {
        console.error("Failed to fetch tree:", error);
        setSelectedTree(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTree();
  }, [selectedCommit]);

  const handlePreview = (filePath: string) => {
    const treeEntry = selectedTree?.content.entries[filePath];
    if (treeEntry) {
      setPreviewFile({ path: filePath, hash: treeEntry.blob_hash });
    }
  };

  const handleDownload = async (filePath: string) => {
    const treeEntry = selectedTree?.content.entries[filePath];
    if (treeEntry) {
      const data = await downloadBlobData(state, treeEntry.blob_hash);
      if (data) {
        saveArrayBuffer(data, `[${selectedTree.hash}]${filePath}`);
      }
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-lg p-4 w-full max-w-4xl mx-2 flex flex-col gap-4">
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          <GitHistoryList
            commits={commits}
            onSelectCommit={setSelectedCommit}
            selectedCommit={selectedCommit}
          />
        </div>
        {selectedCommit && (
          <div className="mt-4 border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Commit Tree Preview</h3>
            {isLoading ? (
              <div className="text-center py-4">Loading tree data...</div>
            ) : selectedTree ? (
              <SnapshotTreePreview
                tree={selectedTree}
                onPreview={handlePreview}
                onDownload={handleDownload}
              />
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Failed to load tree data
              </div>
            )}
          </div>
        )}
        <Button className="self-end mt-2" onClick={onClose}>
          Close
        </Button>
      </div>
      <PreviewModal
        open={previewFile !== null}
        filePath={previewFile?.path || null}
        blobHash={previewFile?.hash || null}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};
