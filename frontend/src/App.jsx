import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import './App.css';

function App() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <div className="dashboard">
              <h1>Welcome, {user.name}!</h1>
              <button className="logout-button" onClick={logout}>Logout</button>
            </div>
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