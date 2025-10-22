import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ChatLayout from './components/ChatLayout';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import './App.css';

function App() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState(null);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        🔄 Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <ChatLayout>
              <div className="sidebar">
                <Sidebar 
                  selectedChatId={selectedChatId}
                  setSelectedChatId={setSelectedChatId} 
                />
              </div>
              <div className="chat-window">
                <ChatWindow selectedChatId={selectedChatId} />
              </div>
            </ChatLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
    </Routes>
  );
}

export default App;