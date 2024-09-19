// src/components/PrivateRoutes.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ element, requiredRole }) => {
  const { currentUser, userRole } = useAuth();
  console.log("PrivateRoute - currentUser:", currentUser, "userRole:", userRole, "requiredRole:", requiredRole);

  if (!currentUser) {
    console.log("PrivateRoute - Redirecting to login");
    return <Navigate to="/login" />;
  }

  if (userRole !== requiredRole) {
    console.log("PrivateRoute - Unauthorized access");
    return <div>Unauthorized access</div>;
  }

  return element;
};

export default PrivateRoute;