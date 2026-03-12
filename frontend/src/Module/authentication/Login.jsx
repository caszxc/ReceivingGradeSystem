import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Campus from "/assets/campus.jpg";
import Logo from "/assets/PLVLogo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import ClipLoader from "react-spinners/ClipLoader";
import { useAuth } from "../../context/authContext";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        login(data.user); // Store user data including role
        navigate("/dashboard");
      } else {
        setShowModal(true);
      }
    } catch {
      setLoading(false);
      setShowModal(true);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0153FF] to-[#001C56] overflow-hidden">
      <div className="w-150 h-150 rounded-full border border-[4pc] border-[#508DFB]/[0.06] absolute -bottom-50 -right-30" />
      <div className="w-140 h-140 rounded-full border border-[4pc] border-[#508DFB]/[0.06] absolute -top-40 -left-20" />
      <div className="w-100 h-100 rounded-full border border-[4pc] border-[#508DFB]/[0.06] absolute -bottom-50 -left-30" />

      <div className="relative z-10 flex items-center justify-center min-h-screen">
        {/* Header */}

        {/* Login Form */}
        <div className="bg-[#DFEBFF] py-3 px-3 shadow-lg rounded-lg relative z-10 flex flex-row items-center gap-6 rounded-lg ">
          {/*img*/}
          <div className="relative">
            <img src={Campus} alt="campus" className="h-80 w-70 rounded-lg" />
            <div className="absolute inset-0 bg-blue-700 opacity-50  rounded-lg " />
            <div className="absolute inset-0 flex items-center justify-center">
              <img src={Logo} alt="logo" className="w-32 h-32" />
            </div>
          </div>

          {/*form*/}
          <form onSubmit={handleSubmit} className="space-y-6 w-80">
            <div className="text-center ">
              <h2 className="text-2xl text-gray-900 mb-6 f">Sign In</h2>
            </div>

            {/*Username*/}
            <div>
              <label
                htmlFor="username"
                className="block text-[.8rem]  font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                // type="email"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[.8rem] "
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            {/*Password*/}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[.8rem] "
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>

            {/* <div className="flex items-center justify-between gap-x-2">
              <label className="flex items-center  text-[.6rem] text-gray-500">
                <input type="checkbox" className="mr-2" />
                Remember me
              </label>
              <a
                href="#"
                className="text-blue-500 text-[.6rem] hover:underline"
              >
                Forgot password?
              </a>
            </div> */}
            <button
              type="submit"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <ClipLoader color="#fff" size={20} />
                  <span className="ml-2">Signing in...</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Error Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-sm z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Login Failed
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Incorrect username or password
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
