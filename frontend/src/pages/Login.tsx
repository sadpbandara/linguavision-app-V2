import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { BrainCircuit, Loader2 } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  
  // Error Message එක ස්ථිරව රඳවා තබාගැනීමට State එකක්
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setErrorMsg(''); // අලුතින් submit කරද්දී පරණ error එක මකා දැමීම

    try {
      const response = await api.post('auth/login/', {
        email: data.email,
        password: data.password,
      });

      // Token Save කිරීම
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // සාර්ථකව ලොග් වූ පසු Dashboard එකට යැවීම
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error(error);
      // දෝෂය තිරයේ දිගටම පෙන්වීමට State එකට ඇතුළත් කිරීම
      setErrorMsg(error.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BrainCircuit className="mx-auto h-12 w-12 text-indigo-600" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Log in to your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {/* දෝෂ පණිවිඩය (Error Message Box) - රතු පැහැයෙන් ස්ථිරව පෙන්වයි */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold text-center shadow-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email address</label>
              <input 
                type="email" 
                {...register('email', { required: true })} 
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 bg-gray-50 focus:bg-white transition-colors" 
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                {...register('password', { required: true })} 
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 bg-gray-50 focus:bg-white transition-colors" 
                placeholder="Enter your password"
              />
            </div>

            {/* ස්ථිර වර්ණ යෙදූ (Solid Colors) Login Button එක */}
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'Log In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Sign up here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;