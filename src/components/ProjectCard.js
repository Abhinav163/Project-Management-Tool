import React from 'react';

const ProjectCard = ({ title, description }) => {
  return (
    <div className="border rounded p-4 shadow-md">
      <h2 className="text-xl font-bold">{title}</h2>
      <p>{description}</p>
    </div>
  );
};

export default ProjectCard;
