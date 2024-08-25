import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PeerProvider from "./PeerProvider";
import ClimbSession from "./ClimbSession";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/climb/:boardName/:boardLayout/:boardSize",
    element: <ClimbSession />,
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
