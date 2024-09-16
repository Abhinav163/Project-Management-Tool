import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto py-8">
      {user ? (
        <h1 className="text-3xl font-bold text-center">
          Hi {user.displayName ? user.displayName : user.email}, welcome to your Dashboard!
        </h1>
      ) : (
        <h1 className="text-3xl font-bold text-center">Welcome to your Dashboard</h1>
      )}
    </div>
  );
};

export default Dashboard;
