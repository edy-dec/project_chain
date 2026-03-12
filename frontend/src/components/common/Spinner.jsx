import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'md', fullscreen = false }) => {
  if (fullscreen) {
    return (
      <div className="spinner-overlay">
        <div className="spinner-container">
          <div className="spinner-logo">⛓</div>
          <div className={`spinner spinner-${size}`} />
          <p className="spinner-label">Se încarcă...</p>
        </div>
      </div>
    );
  }
  return <div className={`spinner spinner-${size}`} />;
};

export default Spinner;
