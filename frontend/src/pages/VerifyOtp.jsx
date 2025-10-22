import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast.error('No email provided. Redirecting...');
      navigate('/register');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('Email verified! Please log in.');
      navigate('/login');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'OTP verification failed';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <h2>Verify OTP</h2>
      <p>Enter the 6-digit OTP sent to <strong>{email}</strong></p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="otp">OTP:</label>
          <input
            type="text"
            id="otp"
            name="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength="6"
            placeholder="Enter 6-digit OTP"
          />
        </div>
        
        <button type="submit" className="auth-button">Verify</button>
      </form>
      
      <p className="auth-link">
        Didn't receive the OTP? <Link to="/register">Register again</Link>
      </p>
    </div>
  );
};

export default VerifyOtp;
