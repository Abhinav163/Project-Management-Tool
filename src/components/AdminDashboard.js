import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc, arrayUnion, onSnapshot } from 'firebase/firestore';

const AdminDashboard = () => {
  const [teammates, setTeammates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
    };

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
    if (taskName === '' || taskDescription === '' || assignedTo === '') {
      alert('Please provide task name, description, and select a teammate.');
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
      };

      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      
      const teammateRef = doc(db, 'users', assignedTo);
      await updateDoc(teammateRef, {
        tasksAssigned: arrayUnion(docRef.id)
      });

      setLoading(false);
      setTaskName('');
      setTaskDescription('');
      setAssignedTo('');
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
      progress: !completed ? 100 : 0
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

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
            className="mb-4 p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select Teammate</option>
            {teammates.map((teammate) => (
              <option key={teammate.id} value={teammate.id}>
                {teammate.username}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddTask}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Assigning...' : 'Assign Task'}
          </button>
        </div>
      </div>

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
                    Assigned to: {teammates.find((tm) => tm.id === task.assignedTo)?.username || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">Progress: {task.progress}%</p>
                </div>
                <button
                  onClick={() => handleToggleTaskCompletion(task.id, task.completed)}
                  className={`py-2 px-4 rounded-md ${
                    task.completed ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                  }`}
                >
                  {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;