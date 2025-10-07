import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';


const App = () => {
  const navigate = useNavigate();
  const protect_data = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return navigate('/');
    }
    try {
      const response = await fetch('/api/chats/my-list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log(data);
      } else if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/');
        toast.error('Session expired. Please log in again.');
      }
    } catch (error) {
      toast.error('Network error: Could not connect to the server.');
    }
  }
  return (
    <div>
      i am home
      <button onClick={protect_data}>Protect Data</button>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
    </div>
  )
}

export default App
