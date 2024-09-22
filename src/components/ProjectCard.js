import React from 'react';

const ProjectCard = ({ title, description, teammates, progress }) => {
  return (
    <div className="border rounded-lg shadow-md p-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <p>{description}</p>
      <p><strong>Teammates:</strong> {teammates.join(', ')}</p> {/* Display usernames */}
      <p><strong>Progress:</strong> {progress}%</p>
    </div>
  );
};

export default ProjectCard;
