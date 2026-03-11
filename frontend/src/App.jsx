import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Module/authentication/Login";
import Dashboard from "./Module/dashboard/Dashboard";
import Upload from "./Module/upload/Upload";
import Layout from "./Components/Layout";
import ViewStudent from "./Module/dashboard/ViewStudent";

import ManageAccount from "./Module/superadmin/ManageAccount";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/view-student"
        element={
          <Layout>
            <ViewStudent />
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
      <Route
        path="/manage-accounts"
        element={
          <Layout>
            <ManageAccount />
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
