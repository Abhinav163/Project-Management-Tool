import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

const Tasks = () => {
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedTasks = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const tasksQuery = query(collection(db, 'tasks'), where('assignedTo', '==', user.uid));
          const tasksSnapshot = await getDocs(tasksQuery);
          const tasksList = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAssignedTasks(tasksList);
        }
      } catch (error) {
        console.error('Error fetching assigned tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTeamTasks = async () => {
      try {
        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        const tasksList = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeamTasks(tasksList);
      } catch (error) {
        console.error('Error fetching team tasks:', error);
      }
    };

    fetchAssignedTasks();
    fetchTeamTasks();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">My Assigned Tasks</h2>
        <ul className="list-disc pl-5">
          {assignedTasks.length > 0 ? (
            assignedTasks.map(task => (
              <li key={task.id} className="mb-2">
                <div className="font-medium">{task.title}</div>
                <p className="text-gray-700">Status: {task.status}</p>
                <p className="text-gray-500">Due Date: {task.dueDate?.toDate().toDateString()}</p>
              </li>
            ))
          ) : (
            <p>No tasks assigned.</p>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Team Tasks</h2>
        <ul className="list-disc pl-5">
          {teamTasks.length > 0 ? (
            teamTasks.map(task => (
              <li key={task.id} className="mb-2">
                <div className="font-medium">{task.title}</div>
                <p className="text-gray-700">Assigned To: {task.assignedTo}</p>
                <p className="text-gray-700">Status: {task.status}</p>
                <p className="text-gray-500">Due Date: {task.dueDate?.toDate().toDateString()}</p>
              </li>
            ))
          ) : (
            <p>No tasks available.</p>
          )}
        </ul>
      </section>
    </div>
  );
};

export default Tasks;
