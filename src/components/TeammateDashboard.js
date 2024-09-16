import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

const TeammateDashboard = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (currentUser) {
      const q = query(collection(db, 'tasks'), where('assignedTo', '==', currentUser.uid));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksList = [];
        querySnapshot.forEach((doc) => {
          tasksList.push({ id: doc.id, ...doc.data() });
        });
        setTasks(tasksList);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Teammate Dashboard</h1>
      <h2 className="text-xl mt-2">Hello, {currentUser?.displayName || 'Teammate'}</h2>
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Your Tasks:</h3>
        <ul>
          {tasks.map(task => (
            <li key={task.id} className="border p-2 my-2">
              <span className="font-semibold">{task.title}</span>: {task.description}
              <button className="ml-2 bg-green-500 text-white px-2 py-1 rounded">Complete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TeammateDashboard;
