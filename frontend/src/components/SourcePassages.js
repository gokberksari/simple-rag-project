import React, { useState } from "react";

function SourcePassages({ sources }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="sources">
      <button
        className="sources-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {expanded ? "Hide sources" : `View ${sources.length} source${sources.length === 1 ? "" : "s"}`}
      </button>
      {expanded && (
        <div className="sources-list">
          {sources.map((src, i) => (
            <div key={i} className="source-item">
              <div className="source-header">
                <span className="source-chip">#{i + 1}</span>
                <span className="source-doc">{src.doc_name}</span>
                <span className="source-page">p. {src.page_number}</span>
                <span className="source-score">
                  {(src.score * 100).toFixed(1)}% match
                </span>
              </div>
              <div className="source-text">{src.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SourcePassages;
