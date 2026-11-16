import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  // පරිශීලකයා දැනටමත් ලොග් වී ඇත්නම්, කෙලින්ම Dashboard එකට යැවීම
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <BrainCircuit className="h-20 w-20 text-indigo-600 mb-6" />
      <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
        Linguavision
      </h1>
      <p className="text-xl md:text-2xl text-gray-500 mb-10 font-medium">
        See it. Hear it. Understand it. Remember it.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => navigate('/login')}
          className="px-8 py-3.5 bg-indigo-600 text-white font-bold text-lg rounded-xl hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
        >
          Login to Account
        </button>
        <button 
          onClick={() => navigate('/signup')}
          className="px-8 py-3.5 bg-white text-indigo-600 font-bold text-lg rounded-xl border-2 border-indigo-100 hover:bg-indigo-50 transition shadow-sm"
        >
          Create New Account
        </button>
      </div>
    </div>
  );
};

export default Home;