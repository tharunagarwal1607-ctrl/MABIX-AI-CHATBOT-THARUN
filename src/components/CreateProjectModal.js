'use client';

import { useState, useRef } from 'react';

export default function CreateProjectModal({ isOpen, onClose, onCreateProject }) {
  const [projectName, setProjectName] = useState('');
  const [materials, setMaterials] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const newFiles = Array.from(fileList).map((f) => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type,
    }));
    setMaterials((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) {
      alert('Please enter a project name.');
      return;
    }
    onCreateProject({
      name: trimmed,
      materialsCount: materials.length,
      materials,
      createdAt: Date.now(),
    });
    setProjectName('');
    setMaterials([]);
    onClose();
  };

  return (
    <div className="project-modal-overlay" onClick={onClose}>
      <div className="project-modal-container" onClick={(e) => e.stopPropagation()}>
        <h2 className="project-modal-title">Create project</h2>
        <p className="project-modal-subtitle">
          Organize your conversations and files in one place. Create podcasts, quizzes, and more from your files.
        </p>

        <form onSubmit={handleSubmit} className="project-modal-form">
          {/* Project Name Input */}
          <div className="project-field-group">
            <label className="project-field-label">Project name</label>
            <input
              type="text"
              className="project-name-input"
              placeholder="Name your project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Add Your Materials Section matching Image 2 */}
          <div className="project-field-group">
            <label className="project-field-label">Add your materials</label>
            <div
              className={`project-dropzone ${isDragging ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-icon">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                  <line x1="12" y1="8" x2="12" y2="14"/>
                  <line x1="9" y1="11" x2="15" y2="11"/>
                </svg>
              </div>
              <p className="dropzone-text">Drag and drop or click to upload</p>

              {/* Cloud Drive Buttons matching Image 2 */}
              <div className="cloud-drive-row" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="cloud-btn onedrive"
                  onClick={() => alert('OneDrive integration: Connect your Microsoft OneDrive account to import documents.')}
                >
                  <span className="cloud-icon">☁️</span> OneDrive
                </button>
                <button
                  type="button"
                  className="cloud-btn gdrive"
                  onClick={() => alert('Google Drive integration: Connect your Google account to import files.')}
                >
                  <span className="cloud-icon">📁</span> Google Drive
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
              multiple
              style={{ display: 'none' }}
            />

            {/* Uploaded Materials List */}
            {materials.length > 0 && (
              <div className="project-materials-list">
                {materials.map((mat, i) => (
                  <div key={i} className="material-pill">
                    <span className="material-icon">📄</span>
                    <span className="material-name">{mat.name}</span>
                    <span className="material-size">{mat.size}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="project-modal-actions">
            <button type="submit" className="create-project-submit-btn">
              Create project
            </button>
            <button type="button" className="create-project-cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
