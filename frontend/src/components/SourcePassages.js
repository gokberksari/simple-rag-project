import React, { useState } from "react";

function SourcePassages({ sources }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="sources">
      <button
        className="sources-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Hide" : "Show"} Sources ({sources.length})
      </button>
      {expanded && (
        <div className="sources-list">
          {sources.map((src, i) => (
            <div key={i} className="source-item">
              <div className="source-header">
                <strong>Source {i + 1}</strong> — {src.doc_name}, Page{" "}
                {src.page_number}
                <span className="source-score">
                  Relevance: {(src.score * 100).toFixed(1)}%
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
