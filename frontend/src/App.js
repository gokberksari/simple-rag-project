import React, { useState, useEffect } from "react";
import axios from "axios";
import DocumentUpload from "./components/DocumentUpload";
import ChatInterface from "./components/ChatInterface";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function App() {
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_URL}/documents`);
      setDocuments(res.data);
    } catch {
      // Server might not be running yet
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/upload`, formData);
      setMessages((prev) => [
        ...prev,
        { role: "system", content: res.data.message },
      ]);
      fetchDocuments();
    } catch (err) {
      const detail = err.response?.data?.detail || "Upload failed.";
      setMessages((prev) => [
        ...prev,
        { role: "system", content: `Error: ${detail}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async (question) => {
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/query`, { question });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.answer,
          sources: res.data.sources,
        },
      ]);
    } catch (err) {
      const detail = err.response?.data?.detail || "Query failed.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${detail}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await axios.delete(`${API_URL}/documents/${docId}`);
      fetchDocuments();
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Document deleted." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Failed to delete document." },
      ]);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">Q&A</div>
        <div>
          <h1>Intelligent Document Q&A</h1>
          <p>Ask questions, grounded in your PDFs</p>
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar">
          <DocumentUpload onUpload={handleUpload} loading={loading} />
          <div className="document-list">
            <h3>Indexed Documents</h3>
            {documents.length === 0 ? (
              <p className="empty-text">No documents uploaded yet.</p>
            ) : (
              <ul>
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <div className="doc-info">
                      <span className="doc-name">{doc.name}</span>
                      <span className="doc-meta">
                        {doc.pages} pages, {doc.chunks} chunks
                      </span>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteDocument(doc.id)}
                      title="Delete document"
                    >
                      x
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        <main className="chat-area">
          <ChatInterface
            messages={messages}
            onSend={handleQuery}
            loading={loading}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
