import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const ChatWindow = ({ selectedChatId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchMessages = async (chatId) => {
    try {
      const response = await api.get(`/chats/${chatId}/messages`);
      setMessages(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch messages');
    }
  };

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChatId) {
      toast.error('Please enter a message');
      return;
    }

    try {
      const response = await api.post(`/chats/${selectedChatId}/messages`, { 
        content: newMessage 
      });
      
      // Add the new user message to the state
      setMessages(prev => [...prev, response.data.data]);
      setNewMessage(''); // Clear the input
      
      // Fetch messages again to get the AI response
      await fetchMessages(selectedChatId);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send message';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="chat-window-content">
      <div className="message-list">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.role}`}
          >
            {message.content}
          </div>
        ))}
      </div>
      
      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatWindow;
