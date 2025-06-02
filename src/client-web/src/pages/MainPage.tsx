import React from "react";
import { useAppContext } from "../context/AppContext";
import { SnapshotTree } from "../components/SnapshotTree";
import { HistoryModal } from "../components/HistoryModal";
import { Button } from "../components/ui/button";
import { PreviewModal } from "../components/PreviewModal";
import { downloadBlobData, listTop10Commits } from "@/lib/appLogic";
import { saveArrayBuffer } from "@/lib/utils";
import type { Action, IAppState } from "@/types";
import type { ITree } from "@gitblobsdb/interface";

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
        {state.mainPage.treeSnapshot && (
          <SnapshotTree
            tree={state.mainPage.treeSnapshot}
            onPreview={handlePreviewOpen}
            onDownload={handlePreviewDownload}
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
