import React from 'react';
import ProjectCard from './ProjectCard';

const Projects = () => {
  const projectList = [
    { title: 'Project 1', description: 'Description of Project 1' },
    { title: 'Project 2', description: 'Description of Project 2' }
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projectList.map((project, index) => (
          <ProjectCard key={index} title={project.title} description={project.description} />
        ))}
      </div>
    </div>
  );
};

export default Projects;
