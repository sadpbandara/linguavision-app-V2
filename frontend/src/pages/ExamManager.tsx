import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Plus, Trash2, X, Clock, Loader2, ArrowLeft, Image as ImageIcon, Music, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const ExamManager = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // විභාගයක් සෑදීමේ State
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [newExam, setNewExam] = useState({ title: '', description: '', time_limit_minutes: 60 });

  // ප්‍රශ්න කළමනාකරණය කිරීමේ State
  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  
  const [newQuestion, setNewQuestion] = useState({ section: 'vocab', text: '' });
  const [choices, setChoices] = useState([
    { text: '', is_correct: true },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ]);

  const fetchExams = async () => {
    try {
      const res = await api.get('learning/exams/');
      setExams(res.data.results || res.data);
      // Active exam එකක් ඇත්නම් එයද යාවත්කාලීන කිරීම
      if (activeExam) {
        const updated = (res.data.results || res.data).find((e: any) => e.id === activeExam.id);
        if (updated) setActiveExam(updated);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchExams(); }, []);

  // 1. අලුත් විභාගයක් සෑදීම
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('learning/exams/', newExam);
      setIsAddingExam(false);
      setNewExam({ title: '', description: '', time_limit_minutes: 60 });
      fetchExams();
    } catch (error) { alert('Failed to create exam'); } finally { setIsSaving(false); }
  };

  // 2. විභාගයකට ප්‍රශ්නයක් ඇතුළත් කිරීම
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam) return;
    
    // පිළිතුරු 4ම පුරවා ඇත්දැයි බැලීම
    if (choices.some(c => c.text.trim() === '')) return alert("Please fill all 4 choices.");

    setIsSaving(true);
    const formData = new FormData();
    formData.append('section', newQuestion.section);
    formData.append('text', newQuestion.text);
    
    const imageInput = document.getElementById('qImage') as HTMLInputElement;
    if (imageInput?.files?.[0]) formData.append('image', imageInput.files[0]);
    
    const audioInput = document.getElementById('qAudio') as HTMLInputElement;
    if (audioInput?.files?.[0]) formData.append('audio', audioInput.files[0]);

    // Choices ටික JSON String එකක් ලෙස යැවීම
    formData.append('choices', JSON.stringify(choices));

    try {
      await api.post(`learning/exams/${activeExam.id}/questions/`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setIsAddingQuestion(false);
      setNewQuestion({ section: 'vocab', text: '' });
      setChoices([{ text: '', is_correct: true }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }]);
      fetchExams();
    } catch (error) { alert('Failed to add question'); } finally { setIsSaving(false); }
  };

  // 3. ප්‍රශ්නයක් මැකීම
  const handleDeleteQuestion = async (qId: number) => {
    if (window.confirm("Are you sure?")) {
      await api.delete(`learning/exams/${activeExam.id}/questions/${qId}/`);
      fetchExams();
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-gray-50"><Loader2 className="h-10 w-10 text-indigo-600 animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><Brain className="text-indigo-600"/> Manage JFT Exams</h1>
            <p className="text-gray-500 mt-1">Create exams and manage questions for students.</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 shadow-sm"><ArrowLeft className="h-4 w-4"/> Dashboard</button>
        </div>

        {/* --- විභාග ලැයිස්තුව පෙන්වන තිරය --- */}
        {!activeExam ? (
          <div>
            <div className="flex justify-end mb-6">
              <button onClick={() => setIsAddingExam(true)} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-sm"><Plus className="h-5 w-5"/> Create New Exam</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {exams.map(exam => (
                <div key={exam.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{exam.title}</h2>
                    <p className="text-gray-500 mb-4 text-sm">{exam.description}</p>
                    <div className="flex gap-4 text-sm font-semibold text-gray-600 mb-6">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Clock className="h-4 w-4 text-indigo-500"/> {exam.time_limit_minutes}m</span>
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><CheckCircle2 className="h-4 w-4 text-green-500"/> {exam.questions?.length || 0} Qs</span>
                    </div>
                  </div>
                  <button onClick={() => setActiveExam(exam)} className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition">Manage Questions</button>
                </div>
              ))}
              {exams.length === 0 && <p className="col-span-3 text-center p-10 text-gray-500 bg-white rounded-2xl border">No exams created yet.</p>}
            </div>
          </div>
        ) : (
          
          /* --- ප්‍රශ්න කළමනාකරණය කරන තිරය --- */
          <div>
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activeExam.title}</h2>
                <p className="text-gray-500">{activeExam.questions?.length || 0} Questions Added</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsAddingQuestion(true)} className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex items-center gap-2"><Plus className="h-5 w-5"/> Add Question</button>
                <button onClick={() => setActiveExam(null)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Back to Exams</button>
              </div>
            </div>

            <div className="space-y-4">
              {activeExam.questions?.map((q: any, i: number) => (
                <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded mb-3 inline-block">{q.section.replace('_', ' ')}</span>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Q{i+1}: {q.text}</h3>
                    <div className="flex gap-4 mb-4">
                      {q.image && <span className="flex items-center gap-1 text-sm text-blue-600"><ImageIcon className="h-4 w-4"/> Image Attached</span>}
                      {q.audio && <span className="flex items-center gap-1 text-sm text-purple-600"><Music className="h-4 w-4"/> Audio Attached</span>}
                    </div>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {q.choices.map((c: any, ci: number) => (
                        <li key={ci} className={c.is_correct ? "text-green-600 font-bold" : ""}>
                          {c.is_correct ? "✓ " : "• "} {c.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5"/></button>
                </div>
              ))}
              {(!activeExam.questions || activeExam.questions.length === 0) && <p className="text-center p-10 bg-white rounded-2xl text-gray-500">No questions added yet. Click "Add Question" to start.</p>}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: අලුත් විභාගයක් සෑදීම */}
      {isAddingExam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md relative shadow-2xl">
            <button onClick={() => setIsAddingExam(false)} className="absolute top-4 right-4 text-gray-400 hover:bg-gray-100 p-2 rounded-full"><X className="h-6 w-6"/></button>
            <h2 className="text-2xl font-bold mb-6">Create New Exam</h2>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label><input type="text" required value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} className="w-full border p-2.5 rounded-lg" placeholder="e.g. JFT Basic Mock 1" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={newExam.description} onChange={e => setNewExam({...newExam, description: e.target.value})} className="w-full border p-2.5 rounded-lg" rows={3} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (Minutes)</label><input type="number" required min="1" value={newExam.time_limit_minutes} onChange={e => setNewExam({...newExam, time_limit_minutes: parseInt(e.target.value)})} className="w-full border p-2.5 rounded-lg" /></div>
              <button type="submit" disabled={isSaving} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-4 flex justify-center">{isSaving ? <Loader2 className="animate-spin h-5 w-5"/> : 'Save Exam'}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ප්‍රශ්නයක් ඇතුළත් කිරීම */}
      {isAddingQuestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAddingQuestion(false)} className="absolute top-4 right-4 text-gray-400 hover:bg-gray-100 p-2 rounded-full"><X className="h-6 w-6"/></button>
            <h2 className="text-2xl font-bold mb-6 text-indigo-700">Add Question</h2>
            
            <form onSubmit={handleAddQuestion} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Section</label>
                  <select value={newQuestion.section} onChange={e => setNewQuestion({...newQuestion, section: e.target.value})} className="w-full border p-2.5 rounded-lg bg-gray-50">
                    <option value="vocab">Script & Vocabulary</option>
                    <option value="conversation">Conversation & Expression</option>
                    <option value="listening">Listening Comprehension</option>
                    <option value="reading">Reading Comprehension</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1 grid grid-cols-2 gap-2">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Image (Opt)</label><input type="file" id="qImage" accept="image/*" className="w-full text-xs" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Audio (Opt)</label><input type="file" id="qAudio" accept="audio/*" className="w-full text-xs" /></div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Question Text</label>
                <textarea required value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} className="w-full border p-3 rounded-lg" rows={3} placeholder="Type your question here..." />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Choices (Select the correct one)</label>
                <div className="space-y-3">
                  {choices.map((c, idx) => (
                    <div key={idx} className={`flex items-center gap-3 p-3 border rounded-xl ${c.is_correct ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <input 
                        type="radio" name="correctChoice" 
                        checked={c.is_correct} 
                        onChange={() => setChoices(choices.map((ch, i) => ({ ...ch, is_correct: i === idx })))}
                        className="w-5 h-5 text-green-600 focus:ring-green-500" 
                      />
                      <input 
                        type="text" required placeholder={`Choice ${idx + 1}`}
                        value={c.text}
                        onChange={(e) => setChoices(choices.map((ch, i) => i === idx ? { ...ch, text: e.target.value } : ch))}
                        className="flex-1 bg-transparent outline-none font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isSaving} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl mt-4 flex justify-center text-lg shadow-md hover:bg-green-700">
                {isSaving ? <Loader2 className="animate-spin h-6 w-6"/> : 'Save Question to Exam'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManager;