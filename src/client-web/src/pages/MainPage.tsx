import React from "react";
import { useAppContext } from "../context/AppContext";
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
  const { state, dispatch } = useAppContext();

  React.useEffect(() => {
    if (!state.mainPage.treeSnapshot) {
      dispatch({ type: "SET_TREE_SNAPSHOT", payload: mockTree });
    }
    if (!state.modalHistory.commitHistory.length) {
      dispatch({ type: "SET_COMMIT_HISTORY", payload: mockCommits });
    }
  }, [state.mainPage.treeSnapshot, state.modalHistory.commitHistory, dispatch]);

  const handlePreview = (filePath: string) => {
    // For now, just mock content. In real app, fetch file content here.
    dispatch({ type: "SET_ROUTE", payload: "modalView" });
    dispatch({ type: "SET_COMMIT", payload: mockCommits[0] });
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
            onClick={() =>
              dispatch({ type: "SET_ROUTE", payload: "modalHistory" })
            }
          >
            History
          </Button>
        </div>
        {state.mainPage.treeSnapshot && (
          <SnapshotTree
            tree={state.mainPage.treeSnapshot}
            onPreview={handlePreview}
            onDownload={handleDownload}
          />
        )}
      </div>
      <HistoryModal
        open={state.route === "modalHistory"}
        onClose={() => dispatch({ type: "SET_ROUTE", payload: "main" })}
        commits={state.modalHistory.commitHistory}
      />
      <PreviewModal
        open={state.route === "modalView"}
        filePath={state.modalView.commit?.hash || null}
        content={state.modalView.commit?.message || null}
        onClose={() => dispatch({ type: "SET_ROUTE", payload: "main" })}
      />
    </div>
  );
};
