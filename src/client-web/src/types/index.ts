import type {
  ITree,
  ICommit,
  ITreeEntry,
  IStorageAdapter,
} from "@gitblobsdb/interface";
export type { ITree, ICommit, ITreeEntry, IStorageAdapter };

// Types
export type Route = "startup" | "main" | "modalHistory" | "modalView";

export interface IAppState {
  core: {
    storage?: IStorageAdapter;
  };
  route: Route;
  mainPage: {
    treeSnapshot: ITree | null;
  };
  modalHistory: {
    commitHistory: ICommit[];
  };
  modalView: {
    treeEntry: ITreeEntry | null;
    filePath: string | null;
  };
}

// Action Types
export type Action =
  | { type: "APP_STARTUP_BEGIN" }
  | { type: "APP_STARTUP_END"; payload: { storage: IStorageAdapter } }
  | { type: "SET_ROUTE"; payload: Route }
  | { type: "SET_TREE_SNAPSHOT"; payload: ITree }
  | { type: "SET_COMMIT_HISTORY"; payload: ICommit[] }
  | {
      type: "SET_PREVIEW_TREE_ENTRY";
      payload: {
        treeEntry: ITreeEntry | null;
        filePath: string | null;
      };
    }
  | { type: "RESET_STATE" };
