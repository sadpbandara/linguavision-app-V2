import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Clock, CheckCircle2, ChevronRight, ChevronLeft, Volume2 } from 'lucide-react';
import api from '../services/api';

const JftExam = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // විභාගය කරගෙන යන විට State
  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // { question_id: choice_id }
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // විභාග ලැයිස්තුව ලබාගැනීම
    api.get('learning/exams/')
      .then(res => setExams(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Timer එක හැසිරවීම
  useEffect(() => {
    if (activeExam && !isFinished && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && activeExam && !isFinished) {
      finishExam(); // කාලය අවසන් වූ විට ඉබේම විභාගය අවසන් වේ
    }
  }, [activeExam, timeLeft, isFinished]);

  const startExam = (exam: any) => {
    setActiveExam(exam);
    setCurrentQIndex(0);
    setAnswers({});
    setIsFinished(false);
    setTimeLeft(exam.time_limit_minutes * 60);
  };

  const handleSelectAnswer = (qId: string, choiceId: string) => {
    setAnswers(prev => ({ ...prev, [qId]: choiceId }));
  };

  const finishExam = async () => {
    setIsFinished(true);
    let calculatedScore = 0;
    
    // ලකුණු ගණනය කිරීම
    activeExam.questions.forEach((q: any) => {
      const selectedChoiceId = answers[q.id];
      const correctChoice = q.choices.find((c: any) => c.is_correct);
      if (correctChoice && correctChoice.id === selectedChoiceId) {
        calculatedScore += 1;
      }
    });
    setScore(calculatedScore);

    // ලකුණු Database එකට යැවීම
    try {
      await api.post('learning/attempts/', {
        exam: activeExam.id,
        score: calculatedScore,
        total_questions: activeExam.questions.length
      });
    } catch (error) {
      console.error("Failed to save attempt", error);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Audio Play කිරීම
  const playAudio = (audioPath: string) => {
    const audioUrl = audioPath.startsWith('http') ? audioPath : `http://127.0.0.1:8000${audioPath}`;
    new Audio(audioUrl).play();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Exams...</div>;

  // 1. විභාග ලැයිස්තුව පෙන්වන තිරය
  if (!activeExam) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><Brain className="text-indigo-600"/> JFT Mock Exams</h1>
              <p className="text-gray-500 mt-1">Test your skills with real exam formats.</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-100">Back to Dashboard</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.length === 0 ? <p className="text-gray-500">No exams available yet. Admin needs to create them.</p> : 
              exams.map(exam => (
                <div key={exam.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{exam.title}</h2>
                  <p className="text-gray-500 mb-4 h-12 overflow-hidden">{exam.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 font-semibold">
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4"/> {exam.time_limit_minutes} mins</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/> {exam.questions?.length || 0} Questions</span>
                  </div>
                  <button onClick={() => startExam(exam)} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">Start Exam</button>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  }

  // 2. විභාගය අවසන් වූ පසු ප්‍රතිඵල තිරය
  if (isFinished) {
    const percentage = Math.round((score / activeExam.questions.length) * 100);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${percentage >= 60 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Exam Completed!</h2>
          <p className="text-gray-500 mb-6">You scored {score} out of {activeExam.questions.length} ({percentage}%)</p>
          <button onClick={() => setActiveExam(null)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 mb-3">Take Another Exam</button>
          <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // 3. විභාගය කරන තිරය (Exam Interface)
  const currentQ = activeExam.questions[currentQIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white px-6 py-4 shadow-sm border-b flex justify-between items-center">
        <h2 className="font-bold text-gray-800">{activeExam.title}</h2>
        <div className={`font-bold text-lg flex items-center gap-2 ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-indigo-600'}`}>
          <Clock className="h-5 w-5" /> {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 max-w-3xl mx-auto w-full p-6 flex flex-col">
        <div className="mb-4">
          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{currentQ.section.replace('_', ' ')}</span>
          <span className="float-right font-bold text-gray-400">Question {currentQIndex + 1} of {activeExam.questions.length}</span>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex-1">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 whitespace-pre-line">{currentQ.text}</h3>

          {/* Image and Audio Support */}
          {currentQ.image && (
            <img src={currentQ.image.startsWith('http') ? currentQ.image : `http://127.0.0.1:8000${currentQ.image}`} alt="Question visual" className="mb-6 max-h-64 object-contain rounded-xl border" />
          )}
          {currentQ.audio && (
            <button onClick={() => playAudio(currentQ.audio)} className="mb-6 flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition">
              <Volume2 className="h-5 w-5"/> Play Audio
            </button>
          )}

          <div className="space-y-3">
            {currentQ.choices.map((choice: any) => (
              <label key={choice.id} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${answers[currentQ.id] === choice.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-300 bg-white'}`}>
                <input 
                  type="radio" 
                  name={`q-${currentQ.id}`} 
                  value={choice.id} 
                  checked={answers[currentQ.id] === choice.id}
                  onChange={() => handleSelectAnswer(currentQ.id, choice.id)}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-3 text-lg text-gray-800 font-medium">{choice.text}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button onClick={() => setCurrentQIndex(prev => prev - 1)} disabled={currentQIndex === 0} className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
            <ChevronLeft className="h-5 w-5"/> Previous
          </button>
          
          {currentQIndex === activeExam.questions.length - 1 ? (
            <button onClick={finishExam} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 transition">Submit Exam</button>
          ) : (
            <button onClick={() => setCurrentQIndex(prev => prev + 1)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition flex items-center gap-2">
              Next <ChevronRight className="h-5 w-5"/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JftExam;