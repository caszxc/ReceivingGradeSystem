import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* <BrowserRouter> */}
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
    {/* </BrowserRouter> */}
  </React.StrictMode>,
);
