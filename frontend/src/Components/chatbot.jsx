import React, { useState, useRef, useEffect } from "react";
import { FaComment, FaTimes, FaPaperPlane } from "react-icons/fa";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "./chatbot.css";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatHistoryRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setMessages([]);
    setIsOpen(false);
  }, [location.pathname]);

  const toggleChatbot = () => {
    setIsOpen((prev) => {
      if (prev) {
        setMessages([]);
        return false;
      } else {
        setMessages([
          { sender: "bot", text: "Hello! How can I assist you today? I can help you analyze search result data—just ask me about a topic or keyword!" },
        ]);
        return true;
      }
    });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input.trim() }; // Trim input to remove extra spaces
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      console.log("Sending message to backend:", userMessage.text); // Debug log
      const response = await axios.post("/api/chat", { message: userMessage.text });
      const botMessage = { sender: "bot", text: response.data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = { sender: "bot", text: "Sorry, I couldn't process your request. Please try again." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <button
        className="chatbot-toggle-btn"
        onClick={toggleChatbot}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? <FaTimes /> : <FaComment />}
      </button>

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h5 className="chatbot-title">Chatbot Assistant</h5>
            <button
              className="chatbot-close-btn"
              onClick={toggleChatbot}
              aria-label="Close chatbot"
            >
              <FaTimes />
            </button>
          </div>

          <div className="chatbot-messages" ref={chatHistoryRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chatbot-message ${
                  message.sender === "user" ? "user-message" : "bot-message"
                }`}
              >
                <span className="message-sender">
                  {message.sender === "user" ? "You" : "Bot"}:
                </span>{" "}
                {message.text}
              </div>
            ))}
            {loading && (
              <div className="chatbot-message bot-message">
                <span className="message-sender">Bot:</span>{" "}
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </div>

          <form className="chatbot-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="form-control chatbot-input"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button
              type="submit"
              className="btn  chatbot-send-btn"
              disabled={loading || !input.trim()}
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;