import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    // Listen for changes in the user's authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Handle clicks outside of the dropdown
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
      })
      .catch((error) => {
        console.error('Error signing out:', error);
      });
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg p-4">
      <div className="container mx-auto flex justify-end items-center">
        <ul className="flex space-x-6">
          <li>
            <Link
              to="/"
              className="text-white text-lg font-semibold hover:text-yellow-300 transition duration-300 ease-in-out"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/projects"
              className="text-white text-lg font-semibold hover:text-yellow-300 transition duration-300 ease-in-out"
            >
              Projects
            </Link>
          </li>
          <li>
            <Link
              to="/tasks"
              className="text-white text-lg font-semibold hover:text-yellow-300 transition duration-300 ease-in-out"
            >
              Tasks
            </Link>
          </li>
          {user ? (
            <li className="relative">
              <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className="text-white text-lg font-semibold hover:text-yellow-300 transition duration-300 ease-in-out"
              >
                {user.displayName ? user.displayName : user.email}
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
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
