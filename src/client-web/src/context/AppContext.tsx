import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { ReactNode } from "react";
import type { ITree, ICommit } from "../types";

// Types
type Route = "main" | "modalHistory" | "modalView";

interface IAppState {
  route: Route;
  mainPage: {
    treeSnapshot: ITree | null;
  };
  modalHistory: {
    commitHistory: ICommit[];
  };
  modalView: {
    commit: ICommit | null;
  };
}

// Action Types
type Action =
  | { type: "SET_ROUTE"; payload: Route }
  | { type: "SET_TREE_SNAPSHOT"; payload: ITree }
  | { type: "SET_COMMIT_HISTORY"; payload: ICommit[] }
  | { type: "SET_COMMIT"; payload: ICommit }
  | { type: "RESET_STATE" };

// Initial State
const initialState: IAppState = {
  route: "main",
  mainPage: {
    treeSnapshot: null,
  },
  modalHistory: {
    commitHistory: [],
  },
  modalView: {
    commit: null,
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
    case "SET_COMMIT":
      return {
        ...state,
        modalView: {
          ...state.modalView,
          commit: action.payload,
        },
      };
    case "RESET_STATE":
      return initialState;
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
