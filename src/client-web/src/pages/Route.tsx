import { useAppContext } from "@/context/AppContext";
import { StartupPage } from "./StartupPage";
import { MainPage } from "./MainPage";

export const Route = () => {
  const { state, dispatch } = useAppContext();

  switch (state.route) {
    case "startup":
      return <StartupPage />;
    default:
      return <MainPage />;
  }
};
