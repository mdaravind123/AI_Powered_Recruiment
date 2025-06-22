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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-800 font-inter">
    <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center sticky top-0 z-50 border-b border-gray-200">
  <h1 className="text-3xl font-extrabold text-green-600 tracking-tight">Recruitify</h1>

  <div className="flex gap-6 items-center text-base font-semibold">
    {user && (
      <>
        <Link
          to="/"
          className="text-gray-700 hover:text-green-600 transition duration-200 hover:underline underline-offset-4"
        >
          Dashboard
        </Link>
        <Link
          to="/jobs"
          className="text-gray-700 hover:text-green-600 transition duration-200 hover:underline underline-offset-4"
        >
          Jobs
        </Link>
      </>
    )}
    {!user && (
      <>
        <Link
          to="/login"
          className="text-gray-700 hover:text-blue-600 transition duration-200 hover:underline underline-offset-4"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="text-gray-700 hover:text-blue-600 transition duration-200 hover:underline underline-offset-4"
        >
          Signup
        </Link>
      </>
    )}
  </div>
</nav>


      <main className="p-6 sm:p-8 max-w-7xl mx-auto">
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
