import React from 'react';
import { useUserStore } from '../store/useUserStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardAnalytics from '../componets/DashboardAnalytics';
import RecruiterDashboard from '../componets/RecruiterDashboard';
import EmployeeDashboard from '../componets/EmployeeDashboard';

// API Base URL - use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const { user, logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`); 
    } catch (err) {
      console.error('Logout error (ignored)', err);
    }
    logout(); 
    localStorage.clear();
    toast.success('Logged out');
    navigate('/login');
  };

  if (!user) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      {/* Top Bar */}
      <div className="bg-white shadow-sm p-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-gray-600 text-sm">Role: <span className="font-semibold capitalize">{user?.role}</span></p>
        </div>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Logout
        </button>
      </div>

      {/* Role-based Dashboard */}
      {user?.role === "recruiter" ? (
        <RecruiterDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  );
}
