import React, { useRef, useState } from "react";

function DocumentUpload({ onUpload, loading }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (file && file.type === "application/pdf") {
      onUpload(file);
    }
  };

  const handleFileChange = (e) => {
    handleFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (loading) return;
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!loading) setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  return (
    <div className="upload-section">
      <h3>Upload Document</h3>
      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <div
        className={`dropzone ${dragging ? "dragging" : ""} ${loading ? "disabled" : ""}`}
        onClick={() => !loading && fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <svg
          className="dropzone-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <div className="dropzone-text">
          {loading ? "Processing..." : "Click or drop a PDF"}
        </div>
        <div className="dropzone-hint">PDF files only</div>
      </div>
    </div>
  );
}

export default DocumentUpload;
