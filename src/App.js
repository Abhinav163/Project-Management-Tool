// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TeammateDashboard from './components/TeammateDashboard';
import PrivateRoute from './components/PrivateRoutes';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin-dashboard"
            element={<PrivateRoute element={<AdminDashboard />} />}
          />
          <Route
            path="/teammate-dashboard"
            element={<PrivateRoute element={<TeammateDashboard />} />}
          />
          <Route
            path="/"
            element={<PrivateRoute element={<AdminDashboard />} />} // Default route
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
