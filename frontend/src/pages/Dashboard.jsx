import React from 'react';
import { useUserStore } from '../store/useUserStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardAnalytics from '../componets/DashboardAnalytics';
export default function Dashboard() {
  const { user, logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout'); 
    } catch (err) {
      console.error('Logout error (ignored)', err);
    }
    logout(); 
    localStorage.clear();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-2">Welcome, {user?.name}</h2>
      <p className="text-gray-600 mb-4">Role: {user?.role}</p>
      <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
        Logout
      </button>
   {user?.role === "recruiter" && <DashboardAnalytics/> } 
    </div>
  );
}
