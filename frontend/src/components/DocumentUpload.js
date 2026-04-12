import React, { useRef } from "react";

function DocumentUpload({ onUpload, loading }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
      e.target.value = "";
    }
  };

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
      <button
        className="upload-btn"
        onClick={() => fileInputRef.current.click()}
        disabled={loading}
      >
        {loading ? "Processing..." : "Choose PDF File"}
      </button>
    </div>
  );
}

export default DocumentUpload;
