import React from "react";
import { useAppContext } from "../context/AppContext";
import { SnapshotTree } from "../components/SnapshotTree";
import { HistoryModal } from "../components/HistoryModal";
import { Button } from "../components/ui/button";
import { PreviewModal } from "../components/PreviewModal";
import { AddEditModal } from "../components/AddEditModal";
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

  const {
    handleAddNewFile,
    handleEditFile,
    handleModalSave,
    handleModalClose,
  } = useAddEditModalHandler(state, dispatch);

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

  return (
    <div className="min-h-svh flex flex-col items-center p-2 bg-background">
      <div className="w-full max-w-xl bg-card rounded-lg shadow-lg p-4 flex flex-col gap-2 mt-4">
        <h1 className="text-xl font-bold text-center mb-2">
          Git Blobs Samples
        </h1>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="truncate max-w-3/4">
            Snapshot hash: {treeSnapshot?.hash}
          </span>
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
      <AddEditModal
        open={state.route === "modalAddEdit"}
        mode={state.modalAddEdit.mode}
        fileName={state.modalAddEdit.fileName}
        fileContent={state.modalAddEdit.fileContent}
        onSave={(fileName, fileContent) => {
          dispatch({
            type: "SET_ADD_EDIT_MODAL",
            payload: {
              ...state.modalAddEdit,
              fileName,
              fileContent,
            },
          });
          handleModalSave(state.modalAddEdit.mode, fileName, fileContent);
        }}
        onClose={handleModalClose}
      />
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

function useAddEditModalHandler(
  state: IAppState,
  dispatch: React.Dispatch<Action>
) {
  const handleAddNewFile = () => {
    dispatch({
      type: "SET_ADD_EDIT_MODAL",
      payload: {
        mode: "add",
        fileName: "",
        fileContent: "",
      },
    });
    dispatch({ type: "SET_ROUTE", payload: "modalAddEdit" });
  };

  const handleEditFile = async (editFileName: string, blobHash: string) => {
    const data = await downloadBlobData(state, blobHash);
    if (data) {
      const decoder = new TextDecoder();
      dispatch({
        type: "SET_ADD_EDIT_MODAL",
        payload: {
          mode: "edit",
          fileName: editFileName,
          fileContent: decoder.decode(data),
        },
      });
      dispatch({ type: "SET_ROUTE", payload: "modalAddEdit" });
    }
  };

  const handleModalSave = async (
    mode: string,
    fileName: string,
    fileContent: string
  ) => {
    if (mode === "add") {
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
    } else if (mode === "edit") {
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
    handleModalClose();
  };

  const handleModalClose = () => {
    dispatch({ type: "SET_ROUTE", payload: "main" });
  };

  return {
    handleAddNewFile,
    handleEditFile,
    handleModalSave,
    handleModalClose,
  };
}
