import React from "react";
import { useAppContext } from "../context/AppContext";
import { SnapshotTree } from "../components/SnapshotTree";
import { HistoryModal } from "../components/HistoryModal";
import { Button } from "../components/ui/button";
import { PreviewModal } from "../components/PreviewModal";
import {
  downloadBlobData,
  listTop10Commits,
  updateFileData,
  deleteFileData,
} from "@/lib/appLogic";
import { saveArrayBuffer } from "@/lib/utils";
import type { Action, IAppState } from "@/types";
import type { ITree } from "@gitblobsdb/interface";
import { FaPlus } from "react-icons/fa";
import { Tooltip } from "@/components/ui/tooltip";

export const MainPage: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"add" | "edit">("add");
  const [fileName, setFileName] = React.useState("");
  const [fileContent, setFileContent] = React.useState("");

  const {
    mainPage: { treeSnapshot },
  } = state;

  if (!treeSnapshot) {
    return null;
  }

  const { handlePreviewOpen, handlePreviewDownload, handlePreviewClose } =
    usePreviewModalHandler(state, dispatch);

  const { handleHistoryOpen, handleHistoryClose } = useHistoryModalHandler(
    state,
    dispatch
  );

  const handleAddNewFile = () => {
    setModalMode("add");
    setFileName("");
    setFileContent("");
    setModalOpen(true);
  };

  const handleEditFile = (editFileName: string, blobHash: string) => {
    setModalMode("edit");
    setFileName(editFileName);
    // Fetch content for edit
    downloadBlobData(state, blobHash).then((data) => {
      if (data) {
        const decoder = new TextDecoder();
        setFileContent(decoder.decode(data));
      } else {
        setFileContent("");
      }
      setModalOpen(true);
    });
  };

  const handleDeleteFile = async (deleteFileName: string) => {
    await deleteFileData(state, deleteFileName);
    // Refresh tree snapshot
    const storage = state.core.storage;
    if (storage) {
      const head = await import("@/lib/coreOpts").then((m) =>
        m.fetchHead(storage)
      );
      if (head) {
        dispatch({ type: "SET_TREE_SNAPSHOT", payload: head.tree });
      }
    }
  };

  const handleModalSave = async () => {
    if (modalMode === "add") {
      // Add new file (reuse addFile logic from coreOpts)
      const storage = state.core.storage;
      if (storage) {
        await import("@/lib/coreOpts").then((m) =>
          m.addFile(storage, fileName, fileContent)
        );
        const head = await import("@/lib/coreOpts").then((m) =>
          m.fetchHead(storage)
        );
        if (head) {
          dispatch({ type: "SET_TREE_SNAPSHOT", payload: head.tree });
        }
      }
    } else if (modalMode === "edit") {
      // Update file
      await updateFileData(state, fileName, fileContent);
      const storage = state.core.storage;
      if (storage) {
        const head = await import("@/lib/coreOpts").then((m) =>
          m.fetchHead(storage)
        );
        if (head) {
          dispatch({ type: "SET_TREE_SNAPSHOT", payload: head.tree });
        }
      }
    }
    setModalOpen(false);
  };

  const handleModalCancel = () => {
    setModalOpen(false);
  };

  return (
    <div className="min-h-svh flex flex-col items-center p-2 bg-background">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-4 flex flex-col gap-2 mt-4">
        <h1 className="text-xl font-bold text-center mb-2">
          Git Blobs Samples
        </h1>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="truncate">Snapshot hash: {treeSnapshot?.hash}</span>
          <Button variant="outline" size="sm" onClick={handleHistoryOpen}>
            History
          </Button>
        </div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Snapshot Tree</h2>
          <Tooltip content="Add New File">
            <Button variant="ghost" size="icon" onClick={handleAddNewFile}>
              <FaPlus />
            </Button>
          </Tooltip>
        </div>
        {state.mainPage.treeSnapshot && (
          <SnapshotTree
            tree={state.mainPage.treeSnapshot}
            onPreview={handlePreviewOpen}
            onDownload={handlePreviewDownload}
            onEdit={handleEditFile}
            onDelete={handleDeleteFile}
          />
        )}
      </div>
      <HistoryModal
        open={state.route === "modalHistory"}
        onClose={handleHistoryClose}
        commits={state.modalHistory.commitHistory}
      />
      <PreviewModal
        open={state.route === "modalView"}
        filePath={state.modalView.filePath || null}
        blobHash={state.modalView.treeEntry?.blob_hash || null}
        onClose={handlePreviewClose}
      />
      {/* Add/Edit File Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-lg p-4 w-full max-w-md mx-2 flex flex-col gap-4">
            <div className="font-semibold text-base mb-2">
              {modalMode === "add" ? "Add New File" : `Edit File: ${fileName}`}
            </div>
            <input
              className="border rounded p-2 text-sm"
              type="text"
              placeholder="File name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              disabled={modalMode === "edit"}
            />
            <textarea
              className="border rounded p-2 text-sm min-h-[120px]"
              placeholder="File content"
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleModalCancel}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleModalSave}
                disabled={!fileName || !fileContent}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function useHistoryModalHandler(
  state: IAppState,
  dispatch: React.Dispatch<Action>
) {
  const handleHistoryOpen = async () => {
    const topCommits = await listTop10Commits(state);

    dispatch({ type: "SET_COMMIT_HISTORY", payload: topCommits });
    dispatch({ type: "SET_ROUTE", payload: "modalHistory" });
  };

  const handleHistoryClose = async () => {
    dispatch({ type: "SET_ROUTE", payload: "main" });
  };

  return { handleHistoryOpen, handleHistoryClose };
}

function usePreviewModalHandler(
  state: IAppState,
  dispatch: React.Dispatch<Action>
) {
  const treeSnapshot = state.mainPage.treeSnapshot;
  if (!treeSnapshot) throw new Error("OoO");

  const handlePreviewOpen = (filePath: string) => {
    const treeEntry = treeSnapshot.entries[filePath];
    if (treeEntry) {
      dispatch({ type: "SET_ROUTE", payload: "modalView" });
      dispatch({
        type: "SET_PREVIEW_TREE_ENTRY",
        payload: {
          treeEntry,
          filePath,
        },
      });
    }
  };

  const handlePreviewClose = () => {
    dispatch({
      type: "SET_PREVIEW_TREE_ENTRY",
      payload: {
        treeEntry: null,
        filePath: null,
      },
    });
    dispatch({ type: "SET_ROUTE", payload: "main" });
  };

  const handlePreviewDownload = async (filePath: string) => {
    const treeEntry = treeSnapshot.entries[filePath];
    const data = await downloadBlobData(state, treeEntry.blob_hash);
    if (data) {
      saveArrayBuffer(data, filePath);
    }
  };
  return { handlePreviewOpen, handlePreviewDownload, handlePreviewClose };
}
