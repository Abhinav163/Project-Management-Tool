import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

const TaskPage = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [error, setError] = useState(null);
  const [usernames, setUsernames] = useState({}); // Store usernames

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      try {
        if (!currentUser || !currentUser.uid) {
          throw new Error('No user is logged in or UID is missing.');
        }

        setLoading(true);
        setError(null);

        // Fetch user role
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (!userDocSnapshot.exists()) {
          throw new Error('User not found in database');
        }

        const userData = userDocSnapshot.data();
        setRole(userData.role || 'unknown');

        // Fetch usernames of all users
        const teammatesSnapshot = await getDocs(collection(db, 'users'));
        const fetchedUsernames = {};
        teammatesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          fetchedUsernames[data.uid] = data.username; // Ensure 'uid' corresponds to the key in your 'users' collection
        });
        setUsernames(fetchedUsernames);

        // Fetch tasks based on the user's role
        let tasksQuery;
        if (userData.role === 'admin') {
          tasksQuery = query(collection(db, 'tasks'));
        } else if (userData.role === 'teammate') {
          tasksQuery = query(
            collection(db, 'tasks'),
            where('assignedTo', '==', currentUser.uid)
          );
        }

        const tasksSnapshot = await getDocs(tasksQuery);
        const fetchedTasks = tasksSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTasks(fetchedTasks);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTasks();
  }, [currentUser]);

  const handleTaskCompletion = async (taskId) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { completed: true });
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, completed: true } : task
        )
      );
    } catch (error) {
      console.error('Error marking task as completed:', error);
    }
  };

  if (loading) {
    return <div className="text-center">Loading tasks...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Tasks</h1>

      {role === 'admin' && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Admin Task Overview</h2>
          <ul className="space-y-4">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <li key={task.id} className="p-4 border border-gray-300 rounded-lg bg-gray-50 hover:shadow-md transition-shadow">
                  <p className="font-bold text-lg">{task.title}</p>
                  <p className="text-gray-600">{task.description}</p>
                  <p className="text-gray-500">
                    <strong>Assigned To:</strong> {usernames[task.assignedTo] || task.assignedTo}
                  </p>
                  <p className="text-gray-500">
                    <strong>Due Date:</strong> {task.dueDate}
                  </p>
                  <p className="text-gray-500">
                    <strong>Status:</strong> {task.completed ? 'Completed' : 'Incomplete'}
                  </p>
                </li>
              ))
            ) : (
              <p className="text-gray-500">No tasks available</p>
            )}
          </ul>
        </div>
      )}

      {role === 'teammate' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Your Tasks</h2>
          <ul className="space-y-4">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <li key={task.id} className="p-4 border border-gray-300 rounded-lg bg-gray-50 hover:shadow-md transition-shadow">
                  <p className="font-bold text-lg">{task.title}</p>
                  <p className="text-gray-600">{task.description}</p>
                  <p className="text-gray-500">
                    <strong>Due Date:</strong> {task.dueDate}
                  </p>
                  <p className="text-gray-500">
                    <strong>Status:</strong>{' '}
                    {task.completed ? (
                      'Completed'
                    ) : (
                      <button
                        onClick={() => handleTaskCompletion(task.id)}
                        className="mt-2 bg-green-500 text-white py-1 px-4 rounded hover:bg-green-600 transition"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </p>
                </li>
              ))
            ) : (
              <p className="text-gray-500">No tasks assigned to you.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TaskPage;
