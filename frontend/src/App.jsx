import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Module/authentication/Login";
import Dashboard from "./Module/dashboard/Dashboard";
import Upload from "./Module/upload/Upload";
import Layout from "./Components/Layout";

function App() {
  return (
    <Routes>
      {/* Login page without sidebar */}
      <Route path="/" element={<Login />} />

      {/* All other pages with sidebar */}
      <Route
        path="/dashboard"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/upload"
        element={
          <Layout>
            <Upload />
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
