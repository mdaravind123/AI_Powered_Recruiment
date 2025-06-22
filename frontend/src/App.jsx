import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import { useUserStore } from "./store/useUserStore";

export default function App() {
  const { user } = useUserStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white text-gray-800">
      <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-600">Recruitify</h1>

        <div className="flex gap-6 items-center text-sm font-medium">
          {user && (
            <>
              <Link
                to="/"
                className="text-gray-700 hover:text-green-600 transition"
              >
                Dashboard
              </Link>
              <Link
                to="/jobs"
                className="text-gray-700 hover:text-green-600 transition"
              >
                Jobs
              </Link>
            </>
          )}
          {!user && (
            <>
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </nav>
      <main className="p-6 max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={user ? <Dashboard /> : <Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
        </Routes>
      </main>
    </div>
  );
}
