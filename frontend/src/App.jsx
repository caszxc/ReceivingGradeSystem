import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Module/authentication/Login";
import Dashboard from "./Module/dashboard/Dashboard";
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default App;
