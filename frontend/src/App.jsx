import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import ApplyJob from "./pages/ApplyJob";
import CreateTestPage from "./pages/CreateTestPage";
import { useUserStore } from "./store/useUserStore";

export default function App() {
  const { user } = useUserStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-800 font-inter">
    <nav className="bg-white/90 backdrop-blur-xl shadow-2xl px-12 py-6 flex justify-between items-center sticky top-0 z-50 border-b-2 border-transparent before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/10 before:via-indigo-500/10 before:to-purple-500/10 before:animate-gradient-x after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-600 after:via-indigo-600 after:to-purple-600">
  <h1 className="relative z-10 text-5xl font-black tracking-tight cursor-pointer group">
    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 drop-shadow-2xl group-hover:from-blue-700 group-hover:via-indigo-700 group-hover:to-purple-700 transition-all duration-500 animate-text-shimmer bg-[length:200%_auto]">
      Recruitify
    </span>
    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500 -z-10"></div>
  </h1>

  <div className="relative z-10 flex gap-10 items-center text-xl font-extrabold">
    {user && (
      <>
        <Link
          to="/"
          className="relative group text-gray-800 transition-all duration-500 px-5 py-3 rounded-xl overflow-hidden"
        >
          <span className="relative z-10 group-hover:text-white transition-colors duration-500">Dashboard</span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-xl"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:w-full transition-all duration-500"></div>
        </Link>
        <Link
          to="/jobs"
          className="relative group text-gray-800 transition-all duration-500 px-5 py-3 rounded-xl overflow-hidden"
        >
          <span className="relative z-10 group-hover:text-white transition-colors duration-500">
            {user.role === 'recruiter' ? 'Manage Jobs' : 'Find Jobs'}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-xl"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-500"></div>
        </Link>
      </>
    )}
    {!user && (
      <>
        <Link
          to="/login"
          className="relative group text-gray-800 transition-all duration-500 px-5 py-3 rounded-xl overflow-hidden"
        >
          <span className="relative z-10 group-hover:text-white transition-colors duration-500">Login</span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-xl"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:w-full transition-all duration-500"></div>
        </Link>
        <Link
          to="/signup"
          className="relative group bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 hover:scale-110 hover:-translate-y-1 overflow-hidden"
        >
          <span className="relative z-10">Signup</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
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
          <Route path="/jobs/:id" element={user?.role === 'recruiter' ? <JobDetails /> : <ApplyJob />} />
          <Route path="/create-test" element={user?.role === 'recruiter' ? <CreateTestPage /> : <Login />} />
        </Routes>
      </main>
    </div>
  );
}
