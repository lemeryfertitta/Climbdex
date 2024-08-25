import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { App as DSApp } from "antd";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PeerProvider from "./PeerProvider";
import ResultsPage from "./ResultsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/climb/:board/:layout/:size",
    element: (
      <DSApp>
        <ResultsPage />
      </DSApp>
    ),
  },
]);

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <PeerProvider>
      <RouterProvider router={router} />
    </PeerProvider>
  </React.StrictMode>,
);
