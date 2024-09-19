// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import AdminDashboard from './components/AdminDashboard';
import TeammateDashboard from './components/TeammateDashboard';
import PrivateRoute from './components/PrivateRoutes';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

const Home = () => {
  const { currentUser, userRole } = useAuth();
  console.log("Home component - currentUser:", currentUser, "userRole:", userRole);

  if (!currentUser) {
    console.log("Redirecting to login");
    return <Navigate to="/login" />;
  }

  if (userRole === 'admin') {
    console.log("Redirecting to admin dashboard");
    return <Navigate to="/admin-dashboard" />;
  } else if (userRole === 'teammate') {
    console.log("Redirecting to teammate dashboard");
    return <Navigate to="/teammate-dashboard" />;
  } else {
    console.log("Invalid user role");
    return <div>Invalid user role</div>;
  }
};

const App = () => {
  console.log("App component rendering");
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/admin-dashboard"
              element={<PrivateRoute element={<AdminDashboard />} requiredRole="admin" />}
            />
            <Route
              path="/teammate-dashboard"
              element={<PrivateRoute element={<TeammateDashboard />} requiredRole="teammate" />}
            />
            <Route path="/" element={<Home />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;