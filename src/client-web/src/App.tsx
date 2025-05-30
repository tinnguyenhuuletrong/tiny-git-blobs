import React from "react";
import { SnapshotProvider } from "./context/SnapshotContext";
import { MainPage } from "./pages/MainPage";

const App: React.FC = () => (
  <SnapshotProvider>
    <MainPage />
  </SnapshotProvider>
);

export default App;
