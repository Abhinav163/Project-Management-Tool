import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

const TeammateDashboard = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teammates, setTeammates] = useState([]);

  const fetchTeammates = useCallback(async () => {
    try {
      const teammatesSnapshot = await getDoc(collection(db, 'users'));
      const fetchedTeammates = [];
      teammatesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.role === 'teammate' && doc.id !== currentUser.uid) {
          fetchedTeammates.push({ id: doc.id, ...data });
        }
      });
      setTeammates(fetchedTeammates);
    } catch (err) {
      console.error('Error fetching teammates:', err);
      setError('Failed to fetch teammates. Please try again later.');
    }
  }, [currentUser.uid]);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      setError(null);

      // Fetch tasks assigned to the current user
      const userTasksQuery = query(collection(db, 'tasks'), where('assignedTo', '==', currentUser.uid));
      const unsubscribeUserTasks = onSnapshot(userTasksQuery, (querySnapshot) => {
        const tasksList = [];
        querySnapshot.forEach((doc) => {
          tasksList.push({ id: doc.id, ...doc.data() });
        });
        setTasks(tasksList);
        setLoading(false);
      }, (err) => {
        console.error('Error fetching user tasks:', err);
        setError('Failed to fetch your tasks. Please try again later.');
        setLoading(false);
      });

      // Fetch tasks assigned to all teammates
      const teamTasksQuery = query(collection(db, 'tasks'), where('assignedTo', '!=', currentUser.uid));
      const unsubscribeTeamTasks = onSnapshot(teamTasksQuery, (querySnapshot) => {
        const teamTasksList = [];
        querySnapshot.forEach((doc) => {
          teamTasksList.push({ id: doc.id, ...doc.data() });
        });
        setTeamTasks(teamTasksList);
      }, (err) => {
        console.error('Error fetching team tasks:', err);
        setError('Failed to fetch team tasks. Please try again later.');
      });

      fetchTeammates();

      return () => {
        unsubscribeUserTasks();
        unsubscribeTeamTasks();
      };
    }
  }, [currentUser, fetchTeammates]);

  const handleUpdateProgress = async (taskId, newProgress) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { 
        progress: newProgress,
        completed: newProgress === 100
      });
    } catch (err) {
      console.error('Error updating task progress:', err);
      setError('Failed to update task progress. Please try again.');
    }
  };

  const TaskItem = ({ task, isUserTask }) => (
    <li key={task.id} className="border p-4 my-2 rounded-lg shadow-sm">
      <h4 className="font-semibold text-lg">{task.taskName}</h4>
      <p className="text-gray-600 mt-1">{task.description}</p>
      {isUserTask ? (
        <div className="mt-2">
          <label htmlFor={`progress-${task.id}`} className="block text-sm font-medium text-gray-700">
            Progress: {task.progress || 0}%
          </label>
          <input 
            type="range" 
            id={`progress-${task.id}`}
            min="0" 
            max="100" 
            value={task.progress || 0}
            onChange={(e) => handleUpdateProgress(task.id, parseInt(e.target.value))}
            className="mt-1 w-full"
          />
          {!task.completed && (
            <button 
              className="mt-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300"
              onClick={() => handleUpdateProgress(task.id, 100)}
            >
              Mark Complete
            </button>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-gray-500">Assigned to: {teammates.find(t => t.id === task.assignedTo)?.username || 'Unknown'}</p>
          <p className="text-sm text-gray-500">Progress: {task.progress || 0}%</p>
        </div>
      )}
    </li>
  );

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Teammate Dashboard</h1>
      <h2 className="text-xl mt-2 mb-4">Welcome, {currentUser?.displayName || 'Teammate'}</h2>
      
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4">Your Tasks</h3>
        {tasks.length > 0 ? (
          <ul className="space-y-4">
            {tasks.map(task => (
              <TaskItem key={task.id} task={task} isUserTask={true} />
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">You don't have any assigned tasks at the moment.</p>
        )}
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-4">Team Tasks</h3>
        {teamTasks.length > 0 ? (
          <ul className="space-y-4">
            {teamTasks.map(task => (
              <TaskItem key={task.id} task={task} isUserTask={false} />
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">There are no team tasks to display at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default TeammateDashboard;