import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ selectedChatId, setSelectedChatId }) => {
  const [chats, setChats] = useState([]);
  const [newChatTitle, setNewChatTitle] = useState('');
  const { logout, user } = useAuth();

  const fetchChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data.data);
    } catch {
      toast.error('Failed to fetch chats');
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const handleCreateChat = async () => {
    if (!newChatTitle.trim()) {
      toast.error('Please enter a chat title');
      return;
    }

    try {
      await api.post('/chats', { title: newChatTitle });
      await fetchChats(); // Refresh the list
      setNewChatTitle(''); // Clear the input
      toast.success('Chat created!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create chat';
      toast.error(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Still proceed with frontend logout even if API fails
    } finally {
      // Always logout on frontend regardless of API success/failure
      logout();
      toast.success('Logged out successfully!');
    }
  };

  return (
    <div className="sidebar-content">
      <h2>Chats</h2>
      
      <div className="user-info">
        <p>Welcome, {user?.name}</p>
        <button className="logout-button-sidebar" onClick={handleLogout}>
          Logout
        </button>
        <button 
          className="test-refresh-button" 
          onClick={async () => {
            console.log("🧪 Testing token refresh manually...");
            try {
              const response = await api.get('/chats');
              console.log("✅ Test request successful:", response.data);
            } catch (error) {
              console.log("❌ Test request failed:", error);
            }
          }}
          style={{ 
            marginTop: '5px', 
            padding: '5px 10px', 
            fontSize: '0.8rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Test Token Refresh
        </button>
      </div>
      
      <div>
        <input
          type="text"
          value={newChatTitle}
          onChange={(e) => setNewChatTitle(e.target.value)}
          placeholder="Enter chat title..."
          className="new-chat-input"
        />
        <button 
          onClick={handleCreateChat}
          className="new-chat-button"
        >
          Create New Chat
        </button>
      </div>

      <ul className="chat-list">
        {chats.map((chat) => (
          <li 
            key={chat.id}
            className={chat.id === selectedChatId ? 'selected' : ''}
            onClick={() => setSelectedChatId(chat.id)}
          >
            {chat.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
