import React from "react";
import { useAppContext } from "../context/AppContext";
import { SnapshotTree } from "../components/SnapshotTree";
import { HistoryModal } from "../components/HistoryModal";
import { Button } from "../components/ui/button";
import { PreviewModal } from "../components/PreviewModal";
import { AddEditModal } from "../components/AddEditModal";
import { Toast } from "../components/ui/toast";
import {
  downloadBlobData,
  listTop10Commits,
  updateFileData,
  deleteFileData,
  exportStorageData,
  importStorageData,
} from "@/lib/appLogic";
import { saveArrayBuffer } from "@/lib/utils";
import type { Action, IAppState } from "@/types";
import { FaPlus } from "react-icons/fa";
import { FaHistory, FaFileImport, FaFileExport } from "react-icons/fa";
import { Tooltip } from "@/components/ui/tooltip";
import { addFile, fetchHead } from "@/lib/coreOpts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export const MainPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [toast, setToast] = React.useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const {
    mainPage: { head },
  } = state;

  if (!head) {
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
      const head = await fetchHead(storage);
      if (head) {
        dispatch({ type: "SET_COMMIT_HEAD", payload: head });
      }
    }
  };

  const handleExport = async () => {
    const result = await exportStorageData(state);
    if (result) {
      saveArrayBuffer(result.data, "backup.bin");
      setToast({ message: "Export successful", type: "success" });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await importStorageData(state, arrayBuffer);
      if (result) {
        // Refresh tree snapshot
        const storage = state.core.storage;
        if (storage) {
          const head = await fetchHead(storage);
          if (head) {
            dispatch({ type: "SET_COMMIT_HEAD", payload: head });
          }
        }
        setToast({ message: "Import successful", type: "success" });
      }
    } catch (error) {
      setToast({ message: "Import failed", type: "error" });
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
            Commit hash: {head?.commit?.hash}
          </span>
          <div className="flex gap-2">
            <input
              type="file"
              id="import-file"
              className="hidden"
              accept=".bin"
              onChange={handleImport}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleHistoryOpen}>
                  <FaHistory className="mr-2 h-4 w-4" />
                  History
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    document.getElementById("import-file")?.click()
                  }
                >
                  <FaFileImport className="mr-2 h-4 w-4" />
                  Import
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <FaFileExport className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">HEAD Tree</h2>
          <Tooltip content="Add New File">
            <Button variant="ghost" size="icon" onClick={handleAddNewFile}>
              <FaPlus />
            </Button>
          </Tooltip>
        </div>
        {state.mainPage.head?.tree && (
          <SnapshotTree
            tree={state.mainPage.head.tree}
            onPreview={handlePreviewOpen}
            onDownload={handlePreviewDownload}
            onEdit={handleEditFile}
            onDelete={handleDeleteFile}
          />
        )}
      </div>
      <HistoryModal
        open={state.route === "main/modalHistory"}
        onClose={handleHistoryClose}
        commits={state.modalHistory.commitHistory}
      />
      <PreviewModal
        open={state.route === "main/modalPreview"}
        filePath={state.modalView.filePath || null}
        blobHash={state.modalView.treeEntry?.blob_hash || null}
        onClose={handlePreviewClose}
      />
      <AddEditModal
        open={state.route === "main/modalAddEdit"}
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
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
    dispatch({ type: "SET_ROUTE", payload: "main/modalHistory" });
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
  const treeSnapshot = state.mainPage.head?.tree;
  if (!treeSnapshot) throw new Error("OoO");

  const handlePreviewOpen = (filePath: string) => {
    const treeEntry = treeSnapshot.content.entries[filePath];
    if (treeEntry) {
      dispatch({ type: "SET_ROUTE", payload: "main/modalPreview" });
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
    const treeEntry = treeSnapshot.content.entries[filePath];
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
    dispatch({ type: "SET_ROUTE", payload: "main/modalAddEdit" });
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
      dispatch({ type: "SET_ROUTE", payload: "main/modalAddEdit" });
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
        await addFile(storage, fileName, fileContent);
        const head = await fetchHead(storage);
        if (head) {
          dispatch({ type: "SET_COMMIT_HEAD", payload: head });
        }
      }
    } else if (mode === "edit") {
      await updateFileData(state, fileName, fileContent);
      const storage = state.core.storage;
      if (storage) {
        const head = await fetchHead(storage);
        if (head) {
          dispatch({ type: "SET_COMMIT_HEAD", payload: head });
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
