import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { ReactNode } from "react";
import type { ITree, ICommit, Action, IAppState } from "../types";

// Initial State
const initialState: IAppState = {
  core: {
    storage: undefined,
  },
  route: "startup",
  mainPage: {
    treeSnapshot: null,
  },
  modalHistory: {
    commitHistory: [],
  },
  modalView: {
    treeEntry: null,
    filePath: null,
  },
  modalAddEdit: {
    mode: "add",
    fileName: "",
    fileContent: "",
  },
};

// Reducer
const reducer = (state: IAppState, action: Action): IAppState => {
  switch (action.type) {
    case "SET_ROUTE":
      return {
        ...state,
        route: action.payload,
      };
    case "SET_TREE_SNAPSHOT":
      return {
        ...state,
        mainPage: {
          ...state.mainPage,
          treeSnapshot: action.payload,
        },
      };
    case "SET_COMMIT_HISTORY":
      return {
        ...state,
        modalHistory: {
          ...state.modalHistory,
          commitHistory: action.payload,
        },
      };
    case "SET_PREVIEW_TREE_ENTRY":
      return {
        ...state,
        modalView: {
          ...state.modalView,
          ...action.payload,
        },
      };
    case "SET_ADD_EDIT_MODAL":
      return {
        ...state,
        modalAddEdit: {
          ...state.modalAddEdit,
          ...action.payload,
        },
      };
    case "RESET_STATE":
      return initialState;

    case "APP_STARTUP_BEGIN": {
      return {
        ...state,
        route: "startup",
      };
    }
    case "APP_STARTUP_END": {
      return {
        ...state,
        route: "main",
        core: {
          storage: action.payload.storage,
        },
      };
    }
    default:
      return state;
  }
};

// Context
interface AppContextProps {
  state: IAppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Provider Component
export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Dev Mode
  useStateDebugLog(state);
  const dispatchWithDev = useMemo(() => {
    return useDispatcherDebugLog(dispatch);
  }, [dispatch]);

  return (
    <AppContext.Provider value={{ state, dispatch: dispatchWithDev }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

// Internal Developer Helper Hook
function useStateDebugLog(state: IAppState) {
  useEffect(() => {
    console.log(`State`, state);
  }, [state]);
}
function useDispatcherDebugLog(
  dispatch: React.ActionDispatch<[action: Action]>
) {
  return (action: Action) => {
    console.log("Action:", action);
    return dispatch(action);
  };
}

// -------------------------- //
