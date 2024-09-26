import React, { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import { collection, getDocs, query, where, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [teammates, setTeammates] = useState([]);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedTeammates, setSelectedTeammates] = useState(['']);

  useEffect(() => {
    const fetchProjectsAndRole = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!currentUser || !currentUser.uid) {
          throw new Error('No user is logged in or UID is missing.');
        }

        const userQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
          const directUserDoc = await getDocs(collection(db, 'users'));
          const userDoc = directUserDoc.docs.find(doc => doc.id === currentUser.uid);

          if (userDoc) {
            const userData = userDoc.data();
            setRole(userData.role || 'unknown');
          } else {
            throw new Error(`User document not found for UID: ${currentUser.uid}`);
          }
        } else {
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          setRole(userData.role || 'unknown');
        }

        // Fetch teammates (excluding admins)
        const teammatesSnapshot = await getDocs(collection(db, 'users'));
        const fetchedTeammates = teammatesSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(user => user.role !== 'admin' && user.id !== currentUser.uid);
        setTeammates(fetchedTeammates);

      } catch (err) {
        console.error('Error fetching projects and role:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectsAndRole();
  }, [currentUser]);

  useEffect(() => {
    const fetchProjectsAndUsernames = async () => {
      try {
        if (!role) return; // Wait until role is fetched

        setLoading(true);
        let fetchedProjects = [];

        if (role === 'admin') {
          // Admin can see all projects
          const projectsSnapshot = await getDocs(collection(db, 'projects'));
          fetchedProjects = await Promise.all(
            projectsSnapshot.docs.map(async docSnapshot => {
              const projectData = docSnapshot.data();
              const teammatesUsernames = await Promise.all(
                projectData.teammates.map(async teammateId => {
                  if (!teammateId) return 'Unknown User'; // Avoid invalid teammateId
                  const userDoc = await getDoc(doc(db, 'users', teammateId));
                  return userDoc.exists() ? userDoc.data().username || 'Unnamed User' : 'Unknown User';
                })
              );
              return {
                id: docSnapshot.id,
                ...projectData,
                teammatesUsernames,
              };
            })
          );
        } else if (role === 'teammate') {
          // Teammates only see projects they are part of
          const q = query(
            collection(db, 'projects'),
            where('teammates', 'array-contains', currentUser.uid)
          );
          const projectsSnapshot = await getDocs(q);
          fetchedProjects = await Promise.all(
            projectsSnapshot.docs.map(async docSnapshot => {
              const projectData = docSnapshot.data();
              const teammatesUsernames = await Promise.all(
                projectData.teammates.map(async teammateId => {
                  if (!teammateId) return 'Unknown User'; // Avoid invalid teammateId
                  const userDoc = await getDoc(doc(db, 'users', teammateId));
                  return userDoc.exists() ? userDoc.data().username || 'Unnamed User' : 'Unknown User';
                })
              );
              return {
                id: docSnapshot.id,
                ...projectData,
                teammatesUsernames,
              };
            })
          );
        }

        setProjects(fetchedProjects);
      } catch (err) {
        console.error('Error fetching projects and teammates:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (role) {
      fetchProjectsAndUsernames();
    }
  }, [role, currentUser]);

  const handleCreateProject = async () => {
    if (!selectedTeammates[0]) {
      alert('At least one teammate selection is mandatory.');
      return;
    }

    try {
      const newProject = {
        title: projectName,
        description: projectDescription,
        teammates: selectedTeammates.filter(Boolean), // Adds only selected teammates
        progress: 0,
      };

      await addDoc(collection(db, 'projects'), newProject);
      setProjectName('');
      setProjectDescription('');
      setSelectedTeammates(['']);
      alert('Project created successfully!');
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const fetchedProjects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Error creating project: ', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleTeammateChange = (index, value) => {
    const updatedTeammates = [...selectedTeammates];
    updatedTeammates[index] = value;
    setSelectedTeammates(updatedTeammates);

    // Add an empty field for the next dropdown if the current selection is valid
    if (value && index === selectedTeammates.length - 1 && selectedTeammates.length < 5) {
      setSelectedTeammates([...updatedTeammates, '']);
    }
  };

  // Filter teammates for the dropdown, ensuring no duplicates
  const filteredTeammates = (selectedTeammates) =>
    teammates.filter((teammate) => !selectedTeammates.includes(teammate.id));

  if (loading) {
    return <div className="text-center mt-10 text-xl">Loading projects...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-800">Projects</h1>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
  
      {/* Display Create Project Button for Admins */}
      {role === 'admin' && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Create a New Project</h2>
          <input
            type="text"
            placeholder="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mb-4 p-3 border-2 border-gray-300 rounded-lg w-full focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />
          <textarea
            placeholder="Project Description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="mb-4 p-3 border-2 border-gray-300 rounded-lg w-full focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />
  
          {/* Teammate Selectors */}
          {selectedTeammates.map((teammateId, index) => (
            <select
              key={index}
              value={teammateId}
              onChange={(e) => handleTeammateChange(index, e.target.value)}
              className="mb-2 p-3 border-2 border-gray-300 rounded-lg w-full focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            >
              <option value="">Select Teammate {index + 1}</option>
              {filteredTeammates(selectedTeammates).map((teammate) => (
                <option key={teammate.id} value={teammate.id}>
                  {teammate.username || teammate.email || 'Unnamed User'}
                </option>
              ))}
            </select>
          ))}
  
          <button
            onClick={handleCreateProject}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out transform hover:scale-105"
          >
            Create Project
          </button>
        </div>
      )}
  
      {/* Display Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              description={project.description}
              teammates={project.teammatesUsernames} // Pass teammate usernames to ProjectCard
              progress={project.progress}
            />
          ))
        ) : (
          <p>No projects found</p>
        )}
      </div>
    </div>
  );
  
};

export default Projects;
