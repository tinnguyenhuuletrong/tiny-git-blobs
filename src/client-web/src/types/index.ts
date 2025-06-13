import type {
  ITree,
  ICommit,
  ITreeEntry,
  IStorageAdapter,
} from "@gitblobsdb/interface";
export type { ITree, ICommit, ITreeEntry, IStorageAdapter };

// Types
export type Route =
  | "startup"
  | "main"
  | "main/modalHistory"
  | "main/modalPreview"
  | "main/modalAddEdit";

export interface IAppState {
  core: {
    storage?: IStorageAdapter;
  };
  route: Route;
  mainPage: {
    head: {
      tree: ITree;
      commit: ICommit;
    } | null;
  };
  modalHistory: {
    commitHistory: ICommit[];
  };
  modalView: {
    treeEntry: ITreeEntry | null;
    filePath: string | null;
  };
  modalAddEdit: {
    mode: "add" | "edit";
    fileName: string;
    fileContent: string;
  };
}

// Action Types
export type Action =
  | { type: "APP_STARTUP_BEGIN" }
  | { type: "APP_STARTUP_END"; payload: { storage: IStorageAdapter } }
  | { type: "SET_ROUTE"; payload: Route }
  | {
      type: "SET_COMMIT_HEAD";
      payload: {
        tree: ITree;
        commit: ICommit;
      };
    }
  | { type: "SET_COMMIT_HISTORY"; payload: ICommit[] }
  | {
      type: "SET_PREVIEW_TREE_ENTRY";
      payload: {
        treeEntry: ITreeEntry | null;
        filePath: string | null;
      };
    }
  | {
      type: "SET_ADD_EDIT_MODAL";
      payload: {
        mode: "add" | "edit";
        fileName: string;
        fileContent: string;
      };
    }
  | { type: "RESET_STATE" };
