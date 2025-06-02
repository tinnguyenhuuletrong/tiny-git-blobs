import { useAppContext } from "@/context/AppContext";
import { appStartingUp } from "@/lib/appLogic";
import { useEffect } from "react";

export const StartupPage = () => {
  const { state, dispatch } = useAppContext();

  // startup
  useEffect(() => {
    appStartingUp(state, dispatch);
  }, []);

  return <>Loading....</>;
};
