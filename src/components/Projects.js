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
  const [primaryTeammate, setPrimaryTeammate] = useState('');
  const [secondaryTeammate, setSecondaryTeammate] = useState('');

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
                  // Fetch each teammate's username using their ID
                  const userDoc = await getDoc(doc(db, 'users', teammateId));
                  return userDoc.exists() ? userDoc.data().username || 'Unnamed User' : 'Unknown User';
                })
              );
              return {
                id: docSnapshot.id,
                ...projectData,
                teammatesUsernames, // Store teammate usernames
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
                  // Fetch each teammate's username using their ID
                  const userDoc = await getDoc(doc(db, 'users', teammateId));
                  return userDoc.exists() ? userDoc.data().username || 'Unnamed User' : 'Unknown User';
                })
              );
              return {
                id: docSnapshot.id,
                ...projectData,
                teammatesUsernames, // Store teammate usernames
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
    if (!primaryTeammate) {
      alert('Primary teammate selection is mandatory.');
      return;
    }

    try {
      const newProject = {
        title: projectName,
        description: projectDescription,
        teammates: [primaryTeammate, secondaryTeammate].filter(Boolean), // Adds only selected teammates
        progress: 0,
      };

      await addDoc(collection(db, 'projects'), newProject);
      setProjectName('');
      setProjectDescription('');
      setPrimaryTeammate('');
      setSecondaryTeammate('');
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

  const handlePrimaryTeammateChange = (e) => {
    setPrimaryTeammate(e.target.value);
    setSecondaryTeammate(''); // Reset secondary teammate selection
  };

  // Filter teammates for the secondary selection (excluding the primary teammate)
  const filteredTeammatesForSecondary = teammates.filter(
    (teammate) => teammate.id !== primaryTeammate
  );

  if (loading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Display Create Project Button for Admins */}
      {role === 'admin' && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Create a New Project</h2>
          <input
            type="text"
            placeholder="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mb-2 p-2 border rounded-md w-full"
          />
          <textarea
            placeholder="Project Description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="mb-2 p-2 border rounded-md w-full"
          />

          {/* Primary Teammate Selector (Mandatory) */}
          <select
            value={primaryTeammate}
            onChange={handlePrimaryTeammateChange}
            className="mb-2 p-2 border rounded-md w-full"
            required
          >
            <option value="">Select Teammate 1</option>
            {teammates.map((teammate) => (
              <option key={teammate.id} value={teammate.id}>
                {teammate.username || teammate.email || 'Unnamed User'}
              </option>
            ))}
          </select>

          {/* Secondary Teammate Selector (Optional) */}
          <select
            value={secondaryTeammate}
            onChange={(e) => setSecondaryTeammate(e.target.value)}
            className="mb-2 p-2 border rounded-md w-full"
            disabled={!primaryTeammate} // Disable if primary teammate is not selected
          >
            <option value="">Select Teammate 2</option>
            {filteredTeammatesForSecondary.map((teammate) => (
              <option key={teammate.id} value={teammate.id}>
                {teammate.username || teammate.email || 'Unnamed User'}
              </option>
            ))}
          </select>

          <button
            onClick={handleCreateProject}
            className="bg-purple-600 text-white py-2 px-6 rounded-full shadow-md hover:bg-purple-700 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
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
