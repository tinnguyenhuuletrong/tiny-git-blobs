import React from "react";
import { useSnapshotContext } from "../context/SnapshotContext";
import { SnapshotTree } from "../components/SnapshotTree";
import { HistoryModal } from "../components/HistoryModal";
import { Button } from "../components/ui/button";
import { PreviewModal } from "../components/PreviewModal";

const mockTree = {
  hash: "abc123",
  entries: {
    "file1.txt": {
      blob_hash: "blob1",
      metadata_hash: "meta1",
      type: "file" as const,
    },
    "file2.md": {
      blob_hash: "blob2",
      metadata_hash: "meta2",
      type: "file" as const,
    },
  },
};
const mockCommits = [
  {
    hash: "c1",
    tree_hash: "abc123",
    parent_hashes: [],
    author: {
      name: "Alice",
      email: "alice@example.com",
      timestamp: new Date().toISOString(),
    },
    committer: {
      name: "Alice",
      email: "alice@example.com",
      timestamp: new Date().toISOString(),
    },
    message: "Initial commit",
  },
];

export const MainPage: React.FC = () => {
  const {
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
  } = useSnapshotContext();

  React.useEffect(() => {
    if (!tree) setTree(mockTree);
    if (!commits.length) setCommits(mockCommits);
  }, [tree, setTree, commits, setCommits]);

  const handlePreview = (filePath: string) => {
    // For now, just mock content. In real app, fetch file content here.
    setPreviewFilePath(filePath);
    setPreviewContent(
      `This is a preview of ${filePath}.\nFile content goes here...`
    );
  };
  const handleDownload = (filePath: string) => {
    alert(`Download: ${filePath}`);
  };

  return (
    <div className="min-h-svh flex flex-col items-center p-2 bg-background">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-4 flex flex-col gap-2 mt-4">
        <h1 className="text-xl font-bold text-center mb-2">Title</h1>
        <div className="flex justify-between items-center text-sm mb-2">
          <span>Snapshot hash</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryModalOpen(true)}
          >
            History
          </Button>
        </div>
        {tree && (
          <SnapshotTree
            tree={tree}
            onPreview={handlePreview}
            onDownload={handleDownload}
          />
        )}
      </div>
      <HistoryModal
        open={isHistoryModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        commits={commits}
      />
      <PreviewModal
        open={!!previewFilePath}
        filePath={previewFilePath}
        content={previewContent}
        onClose={() => {
          setPreviewFilePath(null);
          setPreviewContent(null);
        }}
      />
    </div>
  );
};
