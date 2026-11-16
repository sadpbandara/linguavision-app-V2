import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Trophy, BrainCircuit, LogOut, Settings, Shield } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  const [stats, setStats] = useState({
    wordsLearned: 0,
    streak: 0,
    wordsToReview: 0
  });

  useEffect(() => {
    // 1. User දත්ත ලබාගැනීම
    api.get('auth/me/')
      .then(response => setUser(response.data))
      .catch(error => console.error("Error fetching user", error));

    // 2. ඉගෙනුම් ප්‍රගතිය (Stats) ලබාගැනීම
    const fetchProgress = async () => {
      try {
        // Backend එකෙන් ලබාගන්නා දත්ත (මෙම API එක ඔබගේ backend එකේ තිබිය යුතුය)
        // දැනට සමස්ත වචන ගණනින් තාවකාලික දත්ත පෙන්වීමක් මෙහි කර ඇත. 
        // පසුකාලීනව progress API එකක් සෑදූ විට මෙතැනට එය සම්බන්ධ කරන්න.
        const vocabRes = await api.get('vocabulary/');
        const totalWords = vocabRes.data.results ? vocabRes.data.results.length : vocabRes.data.length;
        
        setStats({
          wordsLearned: Math.floor(totalWords * 0.4), // උදාහරණයක් ලෙස 40% ක් ඉගෙනගෙන ඇතැයි උපකල්පනය කරයි
          streak: 3, // දින 3ක streak එකක් පෙන්වයි
          wordsToReview: totalWords
        });
      } catch (error) {
        console.error("Error fetching progress", error);
      }
    };
    
    fetchProgress();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-8 w-8 text-indigo-600" />
              <span className="font-bold text-xl">Linguavision</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500 hidden sm:block">
                Welcome, {user?.profile?.full_name || 'Student'}
              </span>
              <button onClick={() => navigate('/profile')} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
                <Settings className="h-5 w-5" />
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Learning Dashboard</h1>
          <p className="text-gray-500 mt-1">Track your progress and continue learning.</p>
        </div>

        {user?.is_staff && (
          <div className="mb-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Shield className="h-6 w-6" /></div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Controls</h2>
                <p className="text-sm text-gray-500">Manage vocabulary, languages and bulk imports.</p>
              </div>
            </div>
            <div className="flex flex-wrap w-full md:w-auto gap-3">
              <button onClick={() => navigate('/admin/vocabulary')} className="flex-1 md:flex-none px-5 py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100">Words</button>
              <button onClick={() => navigate('/admin/languages')} className="flex-1 md:flex-none px-5 py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100">Languages</button>
            </div>
            {/* අලුත් React Exam Manager පිටුවට යාම */}
            <button 
              onClick={() => navigate('/admin/exams')} className="flex-1 md:flex-none px-5 py-2.5 bg-purple-50 text-purple-700 font-bold rounded-xl hover:bg-purple-100 transition" >
              Manage Exams
            </button>
            <button onClick={() => navigate('/admin/neuro-studio')} className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition" >
                Neuro Image Studio
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><BookOpen className="h-6 w-6" /></div>
            <div><p className="text-sm font-semibold text-gray-500">Words Learned</p><p className="text-3xl font-bold text-gray-900">{stats.wordsLearned}</p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-4 bg-green-50 text-green-600 rounded-xl"><Trophy className="h-6 w-6" /></div>
            <div><p className="text-sm font-semibold text-gray-500">Current Streak</p><p className="text-3xl font-bold text-gray-900">{stats.streak} Days</p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><BrainCircuit className="h-6 w-6" /></div>
            <div><p className="text-sm font-semibold text-gray-500">Words to Review</p><p className="text-3xl font-bold text-gray-900">{stats.wordsToReview}</p></div>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between shadow-xl mb-8">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2 text-white">Ready for today's lesson?</h2>
            <p className="text-indigo-100 text-lg">You have {stats.wordsToReview} words to review and new words to learn.</p>
          </div>
          <button onClick={() => navigate('/learn')} className="px-10 py-4 bg-white text-indigo-700 font-black text-lg rounded-xl shadow-md hover:bg-gray-50 hover:scale-105 transition-all w-full md:w-auto">START LEARNING</button>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between shadow-xl mb-8">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2 text-white flex items-center justify-center md:justify-start gap-3"><Trophy className="h-8 w-8" /> Play & Test Your Memory</h2>
            <p className="text-yellow-50 text-lg">Challenge yourself with the rapid image quiz!</p>
          </div>
          <button onClick={() => navigate('/game')} className="px-10 py-4 bg-white text-orange-600 font-black text-lg rounded-xl shadow-md hover:bg-gray-50 hover:scale-105 transition-all w-full md:w-auto">PLAY GAME</button>
        </div>

        {/* JFT Exam Section */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between shadow-xl mb-8">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2 text-white flex items-center justify-center md:justify-start gap-3">
              <BrainCircuit className="h-8 w-8" /> JFT Mock Exams
            </h2>
            <p className="text-blue-50 text-lg">
              Prepare for your Japanese test with real-time mock exams.
            </p>
          </div>
          <button 
            onClick={() => navigate('/exams')} 
            className="px-10 py-4 bg-white text-indigo-600 font-black text-lg rounded-xl shadow-md hover:bg-gray-50 hover:scale-105 transition-all w-full md:w-auto"
          >
            TAKE EXAM
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;