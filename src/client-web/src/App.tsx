import React from "react";
import { AppProvider } from "./context/AppContext";
import { MainPage } from "./pages/MainPage";

const App: React.FC = () => (
  <AppProvider>
    <MainPage />
  </AppProvider>
);

export default App;
