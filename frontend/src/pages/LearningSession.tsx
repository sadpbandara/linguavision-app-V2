import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2, X, Loader2, Brain, Filter, ChevronLeft,
  ChevronRight, Eye, EyeOff, BookOpen
} from 'lucide-react';
import api from '../services/api';

interface Vocabulary {
  id: string;
  category: number | null;
  category_name?: string;
  word: string;
  reading: string;
  romaji?: string;
  meaning?: string;
  core_meaning?: string;
  word_type: string;
  example_sentence: string;
  media: { file: string; media_type: string }[];
  audio: { audio_file: string }[];
}

interface Lesson {
  id: number;
  lesson_number: number;
  name: string;
  word_count: number;
}

const LearningSession: React.FC = () => {
  const navigate = useNavigate();

  // වචන සහ පාඩම් (Lessons) ගබඩා කරන States
  const [allVocabulary, setAllVocabulary] = useState<Vocabulary[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeVocabulary, setActiveVocabulary] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);

  // පාඩම පටන් ගැනීමට පෙර තෝරාගන්නා Filters
  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string>('all');
  const [wordTypeFilter, setWordTypeFilter] = useState<string>('all');

  // පාඩම අතරතුර භාවිතා වන States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Page එක Load වන විට වචන සහ Irodori පාඩම් ලැයිස්තුව Backend එකෙන් ලබා ගැනීම
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vocabRes, lessonRes] = await Promise.all([
          api.get('vocabulary/'),
          api.get('categories/')
        ]);
        setAllVocabulary(vocabRes.data.results ? vocabRes.data.results : vocabRes.data);
        setLessons(lessonRes.data.results ? lessonRes.data.results : lessonRes.data);
      } catch (error) {
        console.error('Error loading learning data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. තෝරාගත් පාඩමට (Lesson) සහ වචන වර්ගයට අදාළ වචන ගණන සෙවීම
  const getFilteredWords = () => {
    let filtered = allVocabulary;

    // පාඩම (Irodori Lesson) අනුව වෙන් කිරීම
    if (selectedLesson !== 'all') {
      filtered = filtered.filter(v => String(v.category) === String(selectedLesson));
    }

    // වචන වර්ගය (Noun, Verb, Adjective) අනුව වෙන් කිරීම
    if (wordTypeFilter !== 'all') {
      filtered = wordTypeFilter === 'adjective'
        ? filtered.filter(v => v.word_type === 'i-adjective' || v.word_type === 'na-adjective')
        : filtered.filter(v => v.word_type === wordTypeFilter);
    }

    return filtered;
  };

  // 3. පාඩම ආරම්භ කිරීම
  const startSession = () => {
    const filtered = getFilteredWords();
    if (filtered.length === 0) {
      alert('මෙම පාඩමට අදාළව තවම වචන ඇතුළත් කර නැත!');
      return;
    }
    setActiveVocabulary(filtered);
    setCurrentIndex(0);
    setShowAnswer(false);
    setShowReading(false);
    setSessionStarted(true);
  };

  const handleRating = async (quality: number) => {
    setSubmitting(true);
    try {
      await api.post(`learning/review/${activeVocabulary[currentIndex].id}/`, { quality });
      goNext();
    } catch (error) {
      console.error(error);
      goNext();
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (currentIndex < activeVocabulary.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      setShowReading(false);
    } else {
      alert('පාඩම සාර්ථකව අවසන් කළා! (Lesson Completed)');
      setSessionStarted(false);
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
      setShowReading(false);
    }
  };

  const playAudio = (currentWord: Vocabulary) => {
    if (currentWord?.audio && currentWord.audio.length > 0) {
      const audioPath = currentWord.audio[0].audio_file;
      new Audio(audioPath.startsWith('http') ? audioPath : `http://127.0.0.1:8000${audioPath}`).play();
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentWord.reading || currentWord.word);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const matchingWordsCount = getFilteredWords().length;

  // --- තිරය 1: පාඩම (Lesson 1-18) තෝරාගන්නා තිරය ---
  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-md w-full border border-gray-100">
          <div className="text-center mb-8">
            <Brain className="h-16 w-16 text-indigo-600 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">Select Your Lesson</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Irodori පාඩම තෝරා වචන පුහුණු වීම ආරම්භ කරන්න
            </p>
          </div>

          <div className="space-y-5">
            {/* 1. Irodori පාඩම තෝරන Dropdown එක */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <BookOpen className="inline h-4 w-4 text-indigo-600 mr-1.5" />
                Select Irodori Lesson (පාඩම)
              </label>
              <select
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="all">All Lessons ({allVocabulary.length} words)</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.name} ({lesson.word_count || 0} words)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. වචන වර්ගය තෝරන Dropdown එක */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 text-indigo-600 mr-1.5" />
                Select Word Type (වචන වර්ගය)
              </label>
              <select
                value={wordTypeFilter}
                onChange={(e) => setWordTypeFilter(e.target.value)}
                className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="all">All Word Types</option>
                <option value="noun">Nouns (නාම පද)</option>
                <option value="verb">Verbs (ක්‍රියා පද)</option>
                <option value="adjective">Adjectives (නාම විශේෂණ)</option>
                <option value="expression">Expressions (ප්‍රකාශන)</option>
              </select>
            </div>

            {/* තෝරාගත් පාඩමේ ඇති වචන ගණන පෙන්වීම */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
              <span className="text-sm font-bold text-indigo-700">
                මෙම තේරීම යටතේ වචන {matchingWordsCount} ක් ඇත
              </span>
            </div>

            <button
              onClick={startSession}
              disabled={matchingWordsCount === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              Start Learning ({matchingWordsCount} Words)
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- තිරය 2: වචන පාඩම් කරන තිරය (Flashcard View) ---
  const currentWord = activeVocabulary[currentIndex];
  const progress = ((currentIndex + 1) / activeVocabulary.length) * 100;
  const mediaPath = currentWord.media?.length > 0 ? currentWord.media[0].file : null;
  const mediaUrl = mediaPath
    ? (mediaPath.startsWith('http') ? mediaPath : `http://127.0.0.1:8000${mediaPath}`)
    : 'https://via.placeholder.com/600x400?text=No+Image';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white px-4 py-4 shadow-sm border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between mb-3">
          <button
            onClick={() => setSessionStarted(false)}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-full">
            {currentWord.category_name || 'General Lesson'}
          </div>
          <div className="text-sm font-bold text-gray-600">
            {currentIndex + 1} / {activeVocabulary.length}
          </div>
        </div>
        <div className="max-w-4xl mx-auto bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="w-full h-72 bg-white flex items-center justify-center p-4 relative border-b border-gray-100">
            <button
              onClick={goPrevious}
              disabled={currentIndex === 0}
              className={`absolute left-3 p-3 bg-black/30 text-white rounded-full hover:bg-black/60 transition-all z-10 ${
                currentIndex === 0 ? 'opacity-0 cursor-default' : 'opacity-70'
              }`}
            >
              <ChevronLeft className="h-7 w-7" />
            </button>

            <img
              src={mediaUrl}
              alt={currentWord.word}
              className="max-w-full max-h-full object-contain"
            />

            <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase">
              {currentWord.word_type}
            </div>

            <button
              onClick={goNext}
              disabled={currentIndex === activeVocabulary.length - 1}
              className={`absolute right-3 p-3 bg-black/30 text-white rounded-full hover:bg-black/60 transition-all z-10 ${
                currentIndex === activeVocabulary.length - 1 ? 'opacity-0 cursor-default' : 'opacity-70'
              }`}
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          </div>

          <div className="p-8 flex flex-col items-center text-center relative">
            <button
              onClick={() => setShowReading(!showReading)}
              className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600 transition flex items-center gap-1 text-sm font-semibold"
            >
              {showReading ? (
                <><EyeOff className="h-4 w-4" /> Hide Reading</>
              ) : (
                <><Eye className="h-4 w-4" /> Show Reading</>
              )}
            </button>

            <div className={`h-8 transition-opacity duration-200 ${showReading ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-xl font-bold text-indigo-600">
                {currentWord.reading} {currentWord.romaji ? `(${currentWord.romaji})` : ''}
              </p>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 my-4">
              {currentWord.word}
            </h1>

            <button
              onClick={() => playAudio(currentWord)}
              className="p-4 mb-6 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"
            >
              <Volume2 className="h-8 w-8" />
            </button>

            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full max-w-sm py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition"
              >
                Show Meaning
              </button>
            ) : (
              <div className="w-full">
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-2xl font-extrabold text-emerald-800">
                    {currentWord.meaning || currentWord.core_meaning || currentWord.reading}
                  </p>
                  {currentWord.example_sentence && (
                    <p className="text-sm text-gray-600 mt-2">{currentWord.example_sentence}</p>
                  )}
                </div>

                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  මෙම වචනය ඔබට කොපමණ මතකද?
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button onClick={() => handleRating(0)} disabled={submitting} className="p-3 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100">Again</button>
                  <button onClick={() => handleRating(2)} disabled={submitting} className="p-3 bg-orange-50 text-orange-700 font-bold rounded-xl hover:bg-orange-100">Hard</button>
                  <button onClick={() => handleRating(4)} disabled={submitting} className="p-3 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100">Good</button>
                  <button onClick={() => handleRating(5)} disabled={submitting} className="p-3 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100">Easy</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningSession;