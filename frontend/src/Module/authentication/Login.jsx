import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        navigate("/dashboard");
      } else {
        setShowModal(true);
      }
    } catch {
      setShowModal(true);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col ">
      <div>
        <img src="" alt="Plv Logo" />
        <span>PLV Enrollment System</span>
      </div>
      <div className="flex justify-center items-center flex-col ">
        Login
        <div>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col ">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                className="w-50 border border-1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col ">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                className="w-50 border border-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="mt-4">
              Login
            </button>
          </form>
        </div>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-4 rounded shadow">
              <p>Incorrect credentials</p>
              <button onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
