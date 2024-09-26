import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc, arrayUnion, onSnapshot, deleteDoc } from 'firebase/firestore';

const AdminDashboard = () => {
  const [teammates, setTeammates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState(''); // New state for due date
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true); // To show loading when fetching teammates/tasks

  useEffect(() => {
    // Fetch teammates who are "teammates" role
    const fetchTeammates = async () => {
      const teammatesSnapshot = await getDocs(collection(db, 'users'));
      const fetchedTeammates = [];
      teammatesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.role === 'teammate') {
          fetchedTeammates.push({ id: doc.id, ...data });
        }
      });
      setTeammates(fetchedTeammates);
      setFetchingData(false); // Stop showing loading when teammates are fetched
    };

    // Realtime updates for tasks
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const fetchedTasks = [];
      snapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() });
      });
      setTasks(fetchedTasks);
    });

    fetchTeammates();

    return () => unsubscribeTasks();
  }, []);

  const handleAddTask = async () => {
    setLoading(true);
    if (taskName === '' || taskDescription === '' || assignedTo === '' || dueDate === '') {
      alert('Please provide task name, description, select a teammate, and set a due date.');
      setLoading(false);
      return;
    }

    try {
      const newTask = {
        taskName,
        description: taskDescription,
        assignedTo,
        completed: false,
        progress: 0,
        dueDate, // Include due date
      };

      const docRef = await addDoc(collection(db, 'tasks'), newTask);

      // Update teammate's task list
      const teammateRef = doc(db, 'users', assignedTo);
      await updateDoc(teammateRef, {
        tasksAssigned: arrayUnion(docRef.id),
      });

      setLoading(false);
      setTaskName('');
      setTaskDescription('');
      setAssignedTo('');
      setDueDate(''); // Reset due date
      alert('Task successfully added!');
    } catch (error) {
      console.error('Error adding task: ', error);
      setLoading(false);
    }
  };

  const handleToggleTaskCompletion = async (taskId, completed) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      completed: !completed,
      progress: !completed ? 100 : 0, // Mark 100% if complete, else 0%
    });
  };

  const handleDeleteTask = async (taskId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
        alert('Task deleted successfully!');
      } catch (error) {
        console.error('Error deleting task: ', error);
        alert('Failed to delete the task. Please try again.');
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Loading indicator when fetching teammates */}
      {fetchingData ? (
        <p>Loading teammates...</p>
      ) : (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Assign a new task</h2>
          <div className="flex flex-col">
            <input
              type="text"
              placeholder="Task Name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="mb-4 p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
            />
            <textarea
              placeholder="Task Description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="mb-4 p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="mb-4 p-3 border rounded-md ${theme === 'dark' ? 'text-gray-300 bg-gray-700'} focus:ring-2 focus:ring-blue-400"
            >
              <option  value="" >Select Teammate</option>
              {teammates.map((teammate) => (
                <option key={teammate.id} value={teammate.id}>
                  {teammate.username}
                </option>
              ))}
            </select>
            <label className="text-lg font-semibold mb-1">Due Date</label>
            <input
              type="date" // Add a date input for due date
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mb-4 p-3 text-gray-400 border rounded-md focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleAddTask}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
              disabled={loading}
            >
              {loading ? 'Assigning...' : 'Assign Task'}
            </button>
          </div>
        </div>
      )}

      {/* Display assigned tasks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Assigned Tasks</h2>
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`p-4 border rounded-md ${
                task.completed ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{task.taskName}</p>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <p className="text-sm text-gray-600">
                    Assigned to:{' '}
                    {teammates.find((tm) => tm.id === task.assignedTo)?.username || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">Due Date: {task.dueDate}</p> {/* Display due date */}
                  <p className="text-sm text-gray-600">Progress: {task.progress}%</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleTaskCompletion(task.id, task.completed)}
                    className={`py-2 px-4 rounded-md ${
                      task.completed ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}
                  >
                    {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Task
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;
