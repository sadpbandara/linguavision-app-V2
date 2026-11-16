import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Trophy, X, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface GameQuestion {
  id: string;
  imageUrl: string;
  correctAnswer: string;
  options: string[];
}

const GameSession = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Database එකෙන් දත්ත ගෙන Game එකේ තර්කය (Logic) සැකසීම
  useEffect(() => {
    const fetchAndGenerateGame = async () => {
      try {
        const response = await api.get('vocabulary/');
        const allWords = response.data.results ? response.data.results : response.data;
        
        // පින්තූර සහිත වචන පමණක් තෝරාගැනීම
        const wordsWithImages = allWords.filter((w: any) => w.media && w.media.length > 0);
        
        // අවම වචන 4ක් වත් නොමැති නම් Game එක ආරම්භ නොකිරීම
        if (wordsWithImages.length < 1 || allWords.length < 4) {
          setLoading(false);
          return; 
        }

        // වචන අහඹු ලෙස (Randomly) මිශ්‍ර කර, උපරිම ප්‍රශ්න 10ක් තෝරාගැනීම
        const shuffledWords = [...wordsWithImages].sort(() => 0.5 - Math.random());
        const selectedWords = shuffledWords.slice(0, 10);

        const generatedQuestions = selectedWords.map(correctWord => {
          // නිවැරදි පිළිතුර හැර වෙනත් අහඹු වචන 3ක් තේරීම (වැරදි පිළිතුරු සඳහා)
          const otherWords = allWords.filter((w: any) => w.id !== correctWord.id);
          const wrongOptions = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3).map(w => w.word);
          
          // නිවැරදි පිළිතුර සහ වැරදි පිළිතුරු 3 මිශ්‍ර කිරීම
          const options = [correctWord.word, ...wrongOptions].sort(() => 0.5 - Math.random());
          
          const mediaPath = correctWord.media[0].file;
          const imageUrl = mediaPath.startsWith('http') ? mediaPath : `http://127.0.0.1:8000${mediaPath}`;

          return {
            id: correctWord.id,
            imageUrl,
            correctAnswer: correctWord.word,
            options
          };
        });

        setQuestions(generatedQuestions);
      } catch (error) {
        console.error("Error loading game data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGenerateGame();
  }, []);

  const handleAnswerSelect = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsGameOver(true);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="h-10 w-10 text-indigo-600 animate-spin" /></div>;
  }

  // වචන ප්‍රමාණවත් නැතිනම් පෙන්වන තිරය
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="h-16 w-16 text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Not enough words!</h2>
        <p className="text-gray-500 mb-8 max-w-md">You need at least 4 words in your vocabulary (with at least 1 image) to play the game.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Back to Dashboard</button>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10 text-yellow-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Game Over!</h2>
          <p className="text-gray-500 mb-8">You answered {score} out of {questions.length} correctly.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition">Play Again</button>
            <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white px-4 py-4 shadow-sm flex items-center justify-between border-b">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition"><X className="h-6 w-6" /></button>
        <div className="font-bold text-lg text-indigo-600">Score: {score}</div>
        <div className="text-sm font-medium text-gray-500">{currentIndex + 1} / {questions.length}</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">What does this image represent?</h2>
        
        {/* රූපය නොකැපී පෙන්වීමට object-contain භාවිතය */}
        <div className="w-full h-64 md:h-80 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-8 flex items-center justify-center p-2">
          <img 
            src={currentQuestion.imageUrl} 
            alt="Vocabulary"
            className="max-w-full max-h-full object-contain"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            
            let buttonStyle = "bg-white border-2 border-gray-100 text-gray-700 hover:border-indigo-600 hover:text-indigo-600 shadow-sm";
            if (selectedAnswer) {
              if (isCorrect) buttonStyle = "bg-green-50 border-2 border-green-500 text-green-700";
              else if (isSelected && !isCorrect) buttonStyle = "bg-red-50 border-2 border-red-500 text-red-700";
              else buttonStyle = "bg-gray-50 border-2 border-gray-100 text-gray-400 opacity-50";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={!!selectedAnswer}
                className={`p-4 rounded-xl text-xl font-bold font-sans transition-all flex items-center justify-between ${buttonStyle}`}
              >
                <span>{option}</span>
                {selectedAnswer && isCorrect && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                {isSelected && !isCorrect && <XCircle className="h-6 w-6 text-red-500" />}
              </button>
            );
          })}
        </div>

        {selectedAnswer && (
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all animate-bounce"
          >
            Next Question <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default GameSession;