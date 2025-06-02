import React from "react";
import { AppProvider } from "./context/AppContext";
import { Route } from "./pages/Route";

const App: React.FC = () => (
  <AppProvider>
    <Route />
  </AppProvider>
);

export default App;
