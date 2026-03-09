import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Module/authentication/Login";
import Dashboard from "./Module/dashboard/Dashboard";
import Upload from "./Module/upload/Upload";
import Layout from "./Components/Layout";
import CreateAccount from "./Module/superadmin/CreateAccount";

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
        path="/upload"
        element={
          <Layout>
            <Upload />
          </Layout>
        }
      />
      <Route
        path="/create-account"
        element={
          <Layout>
            <CreateAccount />
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
