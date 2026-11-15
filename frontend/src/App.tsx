import ExamManager from './pages/ExamManager';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LearningSession from './pages/LearningSession';
import GameSession from './pages/GameSession';
import ImportCenter from './pages/ImportCenter';
import LanguageManager from './pages/LanguageManager';
import VocabularyManager from './pages/VocabularyManager';
import Signup from './pages/Signup';
import JftExam from './pages/JftExam';
import NeuroAdminStudio from './pages/NeuroAdminStudio';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/learn" element={<LearningSession />} />
        <Route path="/game" element={<GameSession />} />
        <Route path="/admin/import" element={<ImportCenter />} />
        <Route path="/admin/languages" element={<LanguageManager />} />
        <Route path="/admin/vocabulary" element={<VocabularyManager />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/exams" element={<JftExam />} />
        <Route path="/admin/exams" element={<ExamManager />} />
        <Route path="/admin/neuro-studio" element={<NeuroAdminStudio />} />
      </Routes>
    </Router>
  );
}

export default App;