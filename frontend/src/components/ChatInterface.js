import React, { useState, useRef, useEffect } from "react";
import SourcePassages from "./SourcePassages";

function ChatInterface({ messages, onSend, loading }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.length === 0 && (
          <div className="welcome">
            <h2>Welcome!</h2>
            <p>
              Upload a PDF document using the sidebar, then ask questions about
              its content.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message message-${msg.role}`}>
            <div className="message-label">
              {msg.role === "user"
                ? "You"
                : msg.role === "assistant"
                ? "Assistant"
                : "System"}
            </div>
            <div className="message-content">{msg.content}</div>
            {msg.sources && msg.sources.length > 0 && (
              <SourcePassages sources={msg.sources} />
            )}
          </div>
        ))}
        {loading && (
          <div className="message message-assistant">
            <div className="message-label">Assistant</div>
            <div className="message-content typing">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
