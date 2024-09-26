import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState('');
  const [theme, setTheme] = useState('light');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check localStorage for theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
          setUsername(docSnap.data().username);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUsername('');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log('User signed out');
        setUser(null);
        setUserRole(null);
        setUsername('');
        navigate('/login');
      })
      .catch((error) => {
        console.error('Error signing out:', error);
      });
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDashboardClick = () => {
    navigate(userRole === 'admin' ? '/admin-dashboard' : '/teammate-dashboard');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme); // Save the theme to localStorage
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const dashboardPath = userRole === 'admin' ? '/admin-dashboard' : '/teammate-dashboard';
  const projectsPath = '/projects';
  const tasksPath = '/tasks';

  const isDashboardActive = location.pathname === dashboardPath;
  const isProjectsActive = location.pathname === projectsPath;
  const isTasksActive = location.pathname === tasksPath;

  return (
    <nav className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg p-4">
      <div className="container mx-auto flex justify-end items-center">
        <ul className="flex space-x-6">
          <li>
            {userRole ? (
              <button
                onClick={handleDashboardClick}
                style={{
                  color: isDashboardActive ? 'gold' : 'white',
                  cursor: 'pointer',
                }}
                className="text-lg font-semibold transition duration-300 ease-in-out hover:text-yellow-300"
              >
                Dashboard
              </button>
            ) : (
              <span className="text-white text-lg font-semibold cursor-not-allowed">
                Dashboard
              </span>
            )}
          </li>
          <li>
            <span
              style={{
                color: isProjectsActive && user ? 'gold' : user ? 'white' : 'gray',
                cursor: user ? 'pointer' : 'not-allowed',
              }}
              className="text-lg font-semibold"
              onClick={user ? () => navigate(projectsPath) : null}
            >
              Projects
            </span>
          </li>
          <li>
            <span
              style={{
                color: isTasksActive && user ? 'gold' : user ? 'white' : 'gray',
                cursor: user ? 'pointer' : 'not-allowed',
              }}
              className="text-lg font-semibold"
              onClick={user ? () => navigate(tasksPath) : null}
            >
              Tasks
            </span>
          </li>
          {user ? (
            <li className="relative">
              <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className="text-white text-lg font-semibold hover:text-yellow-300 transition duration-300 ease-in-out"
              >
                {username || user.email}
              </button>
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20"
                >
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-gray-800 text-left hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </li>
          ) : (
            <li>
              <Link
                to="/login"
                className="text-white text-lg font-semibold hover:text-yellow-300 transition duration-300 ease-in-out"
              >
                Login
              </Link>
            </li>
          )}
          <li>
            <button onClick={toggleTheme} className="text-white">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
