import React from "react";

function Login() {
  return (
    <div className="h-screen w-full flex flex-col ">
      <div>
        <img src="" alt="Plv Logo" />
        <span>PLV Enrollment System</span>
      </div>
      <div className="flex justify-center items-center flex-col ">
        Login
        <div>
          <form action="">
            <div className="flex flex-col ">
              <label htmlFor="email">Email</label>
              <input type="Email" className="w-50 border border-1" />
            </div>

            <div className="flex flex-col ">
              <label htmlFor="password">Password</label>
              <input type="Password" className="w-50 border border-1" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
