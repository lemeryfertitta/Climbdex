import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { App as DSApp } from "antd";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PeerProvider from "./PeerProvider";
import ResultsPage from "./board-page/ResultsPage";

const router = createBrowserRouter(
  [
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
  ],
  {
    basename: "/react", // Add this line to set the base path
  },
);

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <PeerProvider>
      <RouterProvider router={router} />
    </PeerProvider>
  </React.StrictMode>,
);
