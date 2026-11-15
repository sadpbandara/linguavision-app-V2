import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Edit2, Trash2, Sparkles, ArrowLeft, X, Check } from 'lucide-react';
import api from '../services/api';

interface Lesson {
  id: number;
  lesson_number: number;
  name: string;
  book_level: string;
  description: string;
  word_count: number;
}

const LessonManager: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState({
    lesson_number: 1,
    name: '',
    book_level: 'Irodori Starter / Elementary',
    description: ''
  });

  const fetchLessons = async () => {
    try {
      const res = await api.get('categories/');
      setLessons(res.data.results || res.data);
    } catch (err) {
      console.error('Error loading lessons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const handleSeed18Lessons = async () => {
    try {
      await api.post('categories/seed_irodori/', { book_level: 'Irodori JFT-Basic (A2)' });
      fetchLessons();
    } catch (err) {
      alert('Failed to generate 18 lessons.');
    }
  };

  const openCreateModal = () => {
    setEditingLesson(null);
    setForm({
      lesson_number: lessons.length + 1,
      name: `Lesson ${String(lessons.length + 1).padStart(2, '0')} - `,
      book_level: 'Irodori JFT-Basic',
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setForm({
      lesson_number: lesson.lesson_number,
      name: lesson.name,
      book_level: lesson.book_level || 'Irodori JFT-Basic',
      description: lesson.description || ''
    });
    setShowModal(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLesson) {
        await api.put(`categories/${editingLesson.id}/`, form);
      } else {
        await api.post('categories/', form);
      }
      setShowModal(false);
      fetchLessons();
    } catch (err) {
      alert('පාඩම Save කිරීමට නොහැකි විය. එම නම දැනටමත් පවතීදැයි බලන්න.');
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!window.confirm('මෙම පාඩම මකා දැමීමට ඔබට විශ්වාසද?')) return;
    try {
      await api.delete(`categories/${id}/`);
      fetchLessons();
    } catch (err) {
      alert('Failed to delete lesson.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              Irodori & JFT Lesson Manager
            </h1>
            <p className="text-gray-500 mt-1">
              පාඩම් 18 සාදන්න, සංස්කරණය කරන්න සහ ඒවාට වෙන වෙනම වචන ඇතුළත් කරන්න.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSeed18Lessons}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
            >
              <Sparkles className="h-4 w-4" /> Auto-Create 18 Irodori Lessons
            </button>
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="h-5 w-5" /> New Lesson
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-12 text-gray-500">Loading lessons...</p>
        ) : lessons.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm">
            <BookOpen className="h-14 w-14 text-indigo-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-800">තවම පාඩම් කිසිවක් සාදා නැත</h2>
            <p className="text-gray-500 mt-1 mb-6">
              ඉහත ඇති "Auto-Create 18 Irodori Lessons" බොත්තම ඔබා තත්පරයෙන් පාඩම් 18ම සාදා ගන්න!
            </p>
            <button
              onClick={handleSeed18Lessons}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
            >
              Generate 18 Irodori Lessons Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-extrabold rounded-full">
                      LESSON {String(lesson.lesson_number).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      {lesson.word_count || 0} Words
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{lesson.name}</h3>
                  <p className="text-xs font-semibold text-gray-400 mb-2">{lesson.book_level}</p>
                  {lesson.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{lesson.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                  <button
                    onClick={() => navigate(`/admin/vocabulary?lesson=${lesson.id}`)}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    + Manage Words
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(lesson)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      title="Edit Lesson"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Delete Lesson"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
            </h2>
            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lesson No.</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.lesson_number}
                    onChange={(e) => setForm({ ...form, lesson_number: parseInt(e.target.value) || 1 })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Book / Program</label>
                  <input
                    type="text"
                    value={form.book_level}
                    onChange={(e) => setForm({ ...form, book_level: e.target.value })}
                    placeholder="e.g., Irodori Starter / IELTS"
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Lesson 01 - 教室のことば (Classroom Expressions)"
                  className="w-full border rounded-xl p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="මෙම පාඩමෙන් ආවරණය වන කොටස්..."
                  className="w-full border rounded-xl p-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Check className="h-5 w-5" /> {editingLesson ? 'Update Lesson' : 'Create Lesson'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonManager;