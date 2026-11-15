import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, Edit2, ArrowLeft, BookOpen, Layers,
  Sparkles, Loader2, X, Image as ImageIcon, Search, Check, Camera
} from 'lucide-react';
import api from '../services/api';

interface Lesson {
  id: string;
  lesson_number: number;
  name: string;
  book_level: string;
  word_count: number;
}

interface Vocabulary {
  id: string;
  category: string | null;
  category_name?: string;
  word: string;
  reading: string;
  romaji?: string;
  meaning?: string;
  core_meaning?: string;
  word_type: string;
  example_sentence: string;
  media: { id: string; file: string; media_type: string }[];
  audio: { id: string; audio_file: string }[];
}

const VocabularyManager: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLessonParam = searchParams.get('lesson') || 'all';

  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<string>(initialLessonParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals state
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showEditWordModal, setShowEditWordModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showManageLessonsModal, setShowManageLessonsModal] = useState(false);

  // 1. Single Word Form State
  const [singleForm, setSingleForm] = useState({
    category: initialLessonParam !== 'all' ? initialLessonParam : '',
    word: '',
    reading: '',
    romaji: '',
    meaning: '',
    word_type: 'noun',
    example_sentence: ''
  });

  // 2. Edit Word & Change Image State
  const [editingWord, setEditingWord] = useState<Vocabulary | null>(null);
  const [editWordForm, setEditWordForm] = useState({
    category: '',
    word: '',
    reading: '',
    romaji: '',
    meaning: '',
    word_type: 'noun',
    example_sentence: ''
  });
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  // 3. Quick Batch (Comma Separated) State
  const [batchLesson, setBatchLesson] = useState<string>(initialLessonParam !== 'all' ? initialLessonParam : '');
  const [batchWordType, setBatchWordType] = useState<string>('noun');
  const [batchWordsInput, setBatchWordsInput] = useState<string>('');
  const [batchReadingsInput, setBatchReadingsInput] = useState<string>('');
  const [batchImages, setBatchImages] = useState<FileList | null>(null);
  const [batchProgress, setBatchProgress] = useState<string>('');

  // 4. Create / Edit Lesson State
  const [newLessonForm, setNewLessonForm] = useState({
    lesson_number: 1,
    name: '',
    book_level: 'Irodori JFT-Basic'
  });
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonData, setEditLessonData] = useState({
    lesson_number: 1,
    name: '',
    book_level: ''
  });

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [vocabRes, lessonRes] = await Promise.all([
        api.get('vocabulary/'),
        api.get('categories/')
      ]);
      const vocabData = vocabRes.data.results ? vocabRes.data.results : vocabRes.data;
      const lessonData = lessonRes.data.results ? lessonRes.data.results : lessonRes.data;

      setVocabulary(vocabData);
      setLessons(lessonData);

      if (lessonData.length > 0 && !singleForm.category) {
        setSingleForm(prev => ({ ...prev, category: String(lessonData[0].id) }));
        setBatchLesson(String(lessonData[0].id));
      }
    } catch (error) {
      console.error('Error loading vocabulary data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSelectLessonFilter = (lessonId: string) => {
    setSelectedLesson(lessonId);
    if (lessonId !== 'all') {
      setSingleForm(prev => ({ ...prev, category: lessonId }));
      setBatchLesson(lessonId);
    }
  };

  // --- Irodori පාඩම් 18 ස්වයංක්‍රීයව සෑදීම ---
  const handleGenerate18Lessons = async () => {
    setSaving(true);
    try {
      await api.post('categories/seed_irodori/', { book_level: 'Irodori JFT-Basic' });
      await fetchAllData();
      alert('Irodori පාඩම් 18 සාර්ථකව සාදන ලදී!');
    } catch (error) {
      alert('පාඩම් සෑදීමේදී දෝෂයක් ඇති විය.');
    } finally {
      setSaving(false);
    }
  };

  // --- අලුත් තනි පාඩමක් සෑදීම ---
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('categories/', newLessonForm);
      setShowLessonModal(false);
      await fetchAllData();
      handleSelectLessonFilter(String(res.data.id));
    } catch (error) {
      alert('පාඩම සෑදීමට නොහැකි විය.');
    } finally {
      setSaving(false);
    }
  };

  // --- පාඩමක් Edit කිරීම (Manage Lessons Modal තුළ) ---
  const startEditingLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setEditLessonData({
      lesson_number: lesson.lesson_number,
      name: lesson.name,
      book_level: lesson.book_level || 'Irodori JFT-Basic'
    });
  };

  const handleUpdateLesson = async (id: string) => {
    setSaving(true);
    try {
      await api.patch(`categories/${id}/`, editLessonData);
      setEditingLessonId(null);
      await fetchAllData();
    } catch (error) {
      alert('පාඩම යාවත්කාලීන කිරීමට නොහැකි විය.');
    } finally {
      setSaving(false);
    }
  };

  // --- පාඩමක් Delete කිරීම ---
  const handleDeleteLesson = async (id: string) => {
    if (!window.confirm('මෙම පාඩම මකා දැමීමට ඔබට විශ්වාසද?')) return;
    try {
      await api.delete(`categories/${id}/`);
      if (String(selectedLesson) === String(id)) {
        setSelectedLesson('all');
      }
      await fetchAllData();
    } catch (error) {
      alert('පාඩම මැකීමට නොහැකි විය.');
    }
  };

  // --- 1. තනි වචනයක් (Single Word) ඇතුළත් කිරීම ---
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.word.trim()) return alert('කරුණාකර ජපන් වචනය ඇතුළත් කරන්න.');

    setSaving(true);
    try {
      const formData = new FormData();
      if (singleForm.category && singleForm.category !== 'all') {
        formData.append('category', singleForm.category);
      }
      formData.append('word', singleForm.word.trim());
      formData.append('reading', singleForm.reading.trim());
      formData.append('romaji', singleForm.romaji.trim());
      formData.append('meaning', singleForm.meaning.trim());
      formData.append('word_type', singleForm.word_type);
      formData.append('example_sentence', singleForm.example_sentence.trim());

      const imgInput = document.getElementById('singleWordImage') as HTMLInputElement;
      if (imgInput?.files?.[0]) {
        formData.append('image', imgInput.files[0]);
      }

      const audioInput = document.getElementById('singleWordAudio') as HTMLInputElement;
      if (audioInput?.files?.[0]) {
        formData.append('audio', audioInput.files[0]);
      }

      await api.post('vocabulary/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowSingleModal(false);
      setSingleForm(prev => ({
        ...prev,
        word: '', reading: '', romaji: '', meaning: '', example_sentence: ''
      }));
      await fetchAllData();
    } catch (error) {
      console.error(error);
      alert('වචනය Save කිරීමට නොහැකි විය.');
    } finally {
      setSaving(false);
    }
  };

  // --- 2. ඇතුළත් කළ වචනයක් සහ එහි පින්තූරය Edit කිරීම ---
  const openEditWordModal = (item: Vocabulary) => {
    setEditingWord(item);
    setEditWordForm({
      category: item.category ? String(item.category) : '',
      word: item.word || '',
      reading: item.reading || '',
      romaji: item.romaji || '',
      meaning: item.meaning || item.core_meaning || '',
      word_type: item.word_type || 'noun',
      example_sentence: item.example_sentence || ''
    });

    const existingImg = item.media?.length > 0 ? item.media[0].file : null;
    const fullImgUrl = existingImg
      ? existingImg.startsWith('http') ? existingImg : `http://127.0.0.1:8000${existingImg}`
      : null;

    setEditImagePreview(fullImgUrl);
    setEditImageFile(null);
    setShowEditWordModal(true);
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('category', editWordForm.category || '');
      formData.append('word', editWordForm.word.trim());
      formData.append('reading', editWordForm.reading.trim());
      formData.append('romaji', editWordForm.romaji.trim());
      formData.append('meaning', editWordForm.meaning.trim());
      formData.append('word_type', editWordForm.word_type);
      formData.append('example_sentence', editWordForm.example_sentence.trim());

      if (editImageFile) {
        formData.append('image', editImageFile);
      }

      const audioInput = document.getElementById('editWordAudio') as HTMLInputElement;
      if (audioInput?.files?.[0]) {
        formData.append('audio', audioInput.files[0]);
      }

      await api.patch(`vocabulary/${editingWord.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowEditWordModal(false);
      setEditingWord(null);
      setEditImageFile(null);
      await fetchAllData();
    } catch (error) {
      console.error('Update word failed:', error);
      alert('වචනය හෝ ඡායාරූපය වෙනස් කිරීමට නොහැකි විය.');
    } finally {
      setSaving(false);
    }
  };

// --- 3. Quick Batch (කොමාවෙන් වෙන් කර වචන රැසක් එකවර ඇතුළත් කිරීම) ---
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const wordsArray = batchWordsInput.split(',').map(w => w.trim()).filter(Boolean);

    // " - " සහිත ආකෘතියක් ඇති විට වචනයක් මැද ඇති කොමාවලින් කැඩීම වැළැක්වීම
    const detailsArray = batchReadingsInput
      .split(/,(?=\s*[^,]+?\s*-\s*)/)
      .map(r => r.trim())
      .filter(Boolean);

    if (wordsArray.length === 0) {
      return alert('කරුණාකර කොමාවෙන් වෙන් කළ ජපන් වචන ලැයිස්තුව ඇතුළත් කරන්න.');
    }

    if (detailsArray.length > 0 && wordsArray.length !== detailsArray.length) {
      return alert(
        `වචන ගණන (${wordsArray.length}) සහ තේරුම් ගණන (${detailsArray.length}) එකිනෙකට සමාන නැත! කරුණාකර වචන මැද අමතර කොමා (,) තිබේදැයි පරීක්ෂා කරන්න.`
      );
    }

    const sortedFiles = batchImages
      ? Array.from(batchImages).sort((a, b) => a.name.localeCompare(b.name))
      : [];

    setSaving(true);
    let successCount = 0;

    try {
      for (let i = 0; i < wordsArray.length; i++) {
        const wordText = wordsArray[i];
        const detailText = detailsArray[i] || '';

        let readingPart = detailText;
        let romajiPart = '';
        let meaningPart = '';

        if (detailText.includes(' - ')) {
          const parts = detailText.split(' - ').map(p => p.trim());
          if (parts.length >= 3) {
            // පළමු කොටස ජපන් වචනයම නම්, දෙවන කොටස Romaji/Reading ලෙසත් තුන්වන කොටස තේරුම ලෙසත් ගැනීම
            readingPart = parts[0] === wordText ? parts[1] : parts[0];
            romajiPart = parts[1] || '';
            meaningPart = parts.slice(2).join(' - ') || '';
          } else if (parts.length === 2) {
            readingPart = parts[0];
            meaningPart = parts[1];
          }
        }

        setBatchProgress(`Saving ${i + 1} of ${wordsArray.length}: ${wordText}...`);

        const formData = new FormData();
        if (batchLesson && batchLesson !== 'all') {
          formData.append('category', batchLesson);
        }
        formData.append('word', wordText);
        formData.append('reading', readingPart);
        formData.append('romaji', romajiPart);
        formData.append('meaning', meaningPart || detailText);
        formData.append('word_type', batchWordType);

        if (sortedFiles[i]) {
          formData.append('image', sortedFiles[i]);
        }

        await api.post('vocabulary/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        successCount++;
      }

      alert(`වචන ${successCount}ක් සාර්ථකව පාඩමට ඇතුළත් කරන ලදී!`);
      setShowBatchModal(false);
      setBatchWordsInput('');
      setBatchReadingsInput('');
      setBatchImages(null);
      setBatchProgress('');
      await fetchAllData();
    } catch (error) {
      console.error('Batch upload error:', error);
      alert(`වචන ${successCount}ක් ඇතුළත් විය. ඉතිරිය ඇතුළත් කිරීමේදී දෝෂයක් මතු විය.`);
    } finally {
      setSaving(false);
      setBatchProgress('');
    }
  };

  // --- වචනයක් මැකීම ---
  const handleDeleteWord = async (id: string) => {
    if (!window.confirm('මෙම වචනය මකා දැමීමට ඔබට විශ්වාසද?')) return;
    try {
      await api.delete(`vocabulary/${id}/`);
      setVocabulary(prev => prev.filter(v => v.id !== id));
    } catch (error) {
      alert('වචනය මැකීමට නොහැකි විය.');
    }
  };

  const filteredVocabulary = vocabulary.filter(v => {
    const matchesLesson = selectedLesson === 'all' || String(v.category) === String(selectedLesson);
    const matchesSearch =
      !searchQuery ||
      v.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.reading && v.reading.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.meaning && v.meaning.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLesson && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2.5">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              Irodori Vocabulary & Lesson Manager
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              ජපන් පාඩම් 18 අනුව වචන සහ පින්තූර වෙන වෙනම කළමනාකරණය කරන්න.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {lessons.length === 0 && (
              <button
                onClick={handleGenerate18Lessons}
                disabled={saving}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 text-sm shadow-sm transition"
              >
                <Sparkles className="h-4 w-4" /> Auto-Create 18 Lessons
              </button>
            )}
            <button
              onClick={() => setShowLessonModal(true)}
              className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl flex items-center gap-1.5 text-sm transition"
            >
              <Plus className="h-4 w-4" /> New Lesson
            </button>
            <button
              onClick={() => setShowSingleModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-sm shadow-sm transition"
            >
              <Plus className="h-4 w-4" /> Add Word
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-sm shadow-sm transition"
            >
              <Layers className="h-4 w-4" /> Quick Batch (Comma)
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl flex items-center gap-1.5 text-sm transition"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </button>
          </div>
        </div>

        {/* Lesson Tabs Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              Filter by Irodori Lesson (පාඩම තෝරන්න)
            </span>
            <button
              onClick={() => setShowManageLessonsModal(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 px-2.5 py-1 bg-indigo-50 rounded-lg"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit / Delete Lessons →
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleSelectLessonFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${
                selectedLesson === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Words ({vocabulary.length})
            </button>

            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => handleSelectLessonFilter(String(lesson.id))}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  String(selectedLesson) === String(lesson.id)
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{lesson.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-black/10">
                  {lesson.word_count || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="වචනය, හිරගනා හෝ තේරුම අනුව සොයන්න..."
            className="w-full outline-none text-sm text-gray-800"
          />
        </div>

        {/* Words Grid */}
        {filteredVocabulary.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <p className="text-gray-500 font-medium mb-4">
              මෙම පාඩමට අදාළව තවම වචන ඇතුළත් කර නැත.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowSingleModal(true)}
                className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm"
              >
                + Add Single Word
              </button>
              <button
                onClick={() => setShowBatchModal(true)}
                className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm"
              >
                + Quick Batch Import
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredVocabulary.map((item) => {
              const imgPath = item.media?.length > 0 ? item.media[0].file : null;
              const imgUrl = imgPath
                ? imgPath.startsWith('http') ? imgPath : `http://127.0.0.1:8000${imgPath}`
                : null;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="h-44 bg-gray-100 flex items-center justify-center relative border-b">
                      {imgUrl ? (
                        <img src={imgUrl} alt={item.word} className="w-full h-full object-contain p-2 bg-white" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <ImageIcon className="h-10 w-10 mb-1" />
                          <span className="text-xs">No Image</span>
                        </div>
                      )}

                      <span className="absolute top-2.5 left-2.5 bg-indigo-600/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        {item.category_name || 'Unassigned'}
                      </span>

                      {/* Action Buttons: Edit (Change Image/Text) & Delete */}
                      <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                        <button
                          onClick={() => openEditWordModal(item)}
                          title="Edit Word / Change Image"
                          className="p-2 bg-white/95 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-full shadow-sm transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWord(item.id)}
                          title="Delete Word"
                          className="p-2 bg-white/95 hover:bg-red-600 text-red-600 hover:text-white rounded-full shadow-sm transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Quick Change Image Overlay Button */}
                      <button
                        onClick={() => openEditWordModal(item)}
                        className="absolute bottom-2 right-2 bg-black/70 hover:bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                      >
                        <Camera className="h-3.5 w-3.5" /> පින්තූරය වෙනස් කරන්න
                      </button>
                    </div>

                    <div className="p-4">
                      <h3 className="text-2xl font-black text-gray-900">{item.word}</h3>
                      <p className="text-sm font-bold text-indigo-600 mt-0.5">
                        {item.reading} {item.romaji ? `(${item.romaji})` : ''}
                      </p>
                      {(item.meaning || item.core_meaning) && (
                        <p className="text-sm font-semibold text-gray-700 mt-2 bg-gray-50 px-3 py-1.5 rounded-lg border">
                          {item.meaning || item.core_meaning}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: EDIT WORD & CHANGE IMAGE (වචනය සහ ඡායාරූපය වෙනස් කිරීම)
      ===================================================================== */}
      {showEditWordModal && editingWord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowEditWordModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-indigo-600" />
              Edit Word & Change Image ({editingWord.word})
            </h2>

            <form onSubmit={handleUpdateWordSubmit} className="space-y-4">
              {/* Image Preview & Upload Box */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center">
                {editImagePreview ? (
                  <img
                    src={editImagePreview}
                    alt="Preview"
                    className="h-36 object-contain rounded-xl mb-3 bg-white p-2 border"
                  />
                ) : (
                  <div className="h-28 flex flex-col items-center justify-center text-gray-400 mb-2">
                    <ImageIcon className="h-10 w-10 mb-1" />
                    <span className="text-xs">දැනට ඡායාරූපයක් නැත</span>
                  </div>
                )}
                <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition">
                  <Camera className="h-4 w-4" />
                  අලුත් ඡායාරූපයක් තෝරන්න (Change Image)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageSelect}
                    className="hidden"
                  />
                </label>
                {editImageFile && (
                  <span className="text-xs text-emerald-600 font-bold mt-1.5">
                    Selected: {editImageFile.name}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Irodori Lesson (පාඩම)
                </label>
                <select
                  value={editWordForm.category}
                  onChange={(e) => setEditWordForm({ ...editWordForm, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-semibold bg-indigo-50/40"
                >
                  <option value="">-- Unassigned --</option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Japanese Word *</label>
                  <input
                    type="text"
                    required
                    value={editWordForm.word}
                    onChange={(e) => setEditWordForm({ ...editWordForm, word: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hiragana Reading</label>
                  <input
                    type="text"
                    value={editWordForm.reading}
                    onChange={(e) => setEditWordForm({ ...editWordForm, reading: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Romaji</label>
                  <input
                    type="text"
                    value={editWordForm.romaji}
                    onChange={(e) => setEditWordForm({ ...editWordForm, romaji: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Meaning</label>
                  <input
                    type="text"
                    value={editWordForm.meaning}
                    onChange={(e) => setEditWordForm({ ...editWordForm, meaning: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Word Type</label>
                  <select
                    value={editWordForm.word_type}
                    onChange={(e) => setEditWordForm({ ...editWordForm, word_type: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  >
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="expression">Expression</option>
                    <option value="i-adjective">I-Adjective</option>
                    <option value="na-adjective">Na-Adjective</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Replace Audio (Optional)</label>
                  <input id="editWordAudio" type="file" accept="audio/*" className="w-full text-xs pt-1.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition"
              >
                {saving ? 'Updating...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: EDIT / DELETE LESSONS (පාඩම් සංස්කරණය සහ මැකීම)
      ===================================================================== */}
      {showManageLessonsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[88vh] flex flex-col">
            <button
              onClick={() => setShowManageLessonsModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Edit / Delete Irodori Lessons</h2>
            <p className="text-xs text-gray-500 mb-4">
              ඕනෑම පාඩමක නම හෝ අංකය වෙනස් කිරීමට පැන්සල් ලකුණ (Edit) ඔබන්න.
            </p>

            <div className="overflow-y-auto flex-1 divide-y border rounded-2xl">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50">
                  {editingLessonId === lesson.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="number"
                        value={editLessonData.lesson_number}
                        onChange={(e) => setEditLessonData({ ...editLessonData, lesson_number: parseInt(e.target.value) || 1 })}
                        className="w-16 border rounded-lg p-2 text-sm font-bold"
                      />
                      <input
                        type="text"
                        value={editLessonData.name}
                        onChange={(e) => setEditLessonData({ ...editLessonData, name: e.target.value })}
                        className="flex-1 border rounded-lg p-2 text-sm font-bold"
                      />
                      <button
                        onClick={() => handleUpdateLesson(lesson.id)}
                        disabled={saving}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Check className="h-4 w-4" /> Save
                      </button>
                      <button
                        onClick={() => setEditingLessonId(null)}
                        className="px-2.5 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mr-2">
                          #{lesson.lesson_number}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">{lesson.name}</span>
                        <span className="text-xs text-gray-400 ml-2">({lesson.word_count || 0} words)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEditingLesson(lesson)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Edit Lesson"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete Lesson"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: ADD SINGLE WORD (තනි වචනයක් ඇතුළත් කිරීම)
      ===================================================================== */}
      {showSingleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowSingleModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Single Vocabulary Word</h2>

            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Irodori Lesson (පාඩම තෝරන්න) *
                </label>
                <select
                  value={singleForm.category}
                  onChange={(e) => setSingleForm({ ...singleForm, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-semibold bg-indigo-50/40"
                >
                  <option value="">-- Select Lesson --</option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Japanese Word (Kanji/Kana) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 出席"
                    value={singleForm.word}
                    onChange={(e) => setSingleForm({ ...singleForm, word: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hiragana Reading *</label>
                  <input
                    type="text"
                    placeholder="e.g., しゅっせき"
                    value={singleForm.reading}
                    onChange={(e) => setSingleForm({ ...singleForm, reading: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Romaji</label>
                  <input
                    type="text"
                    placeholder="e.g., shusseki"
                    value={singleForm.romaji}
                    onChange={(e) => setSingleForm({ ...singleForm, romaji: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Meaning (English / Sinhala)</label>
                  <input
                    type="text"
                    placeholder="e.g., Attendance / පැමිණීම"
                    value={singleForm.meaning}
                    onChange={(e) => setSingleForm({ ...singleForm, meaning: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Image File</label>
                  <input id="singleWordImage" type="file" accept="image/*" className="w-full text-xs pt-1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Audio File (Optional)</label>
                  <input id="singleWordAudio" type="file" accept="audio/*" className="w-full text-xs pt-1" />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition"
              >
                {saving ? 'Saving Word...' : 'Save Word to Lesson'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: QUICK BATCH IMPORT
      ===================================================================== */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowBatchModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-emerald-800 mb-1 flex items-center gap-2">
              <Layers className="h-6 w-6" /> Quick Batch Import
            </h2>

            <form onSubmit={handleBatchSubmit} className="space-y-4 mt-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Select Irodori Lesson *</label>
                  <select
                    value={batchLesson}
                    onChange={(e) => setBatchLesson(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-bold bg-emerald-50/50"
                  >
                    <option value="">-- Select Lesson --</option>
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Word Type</label>
                  <select
                    value={batchWordType}
                    onChange={(e) => setBatchWordType(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm"
                  >
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="expression">Expression</option>
                    <option value="i-adjective">I-Adjective</option>
                    <option value="na-adjective">Na-Adjective</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  1. Japanese Words (කොමාවෙන් වෙන් කරන්න) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={batchWordsInput}
                  onChange={(e) => setBatchWordsInput(e.target.value)}
                  placeholder="出席, 始めましょう, 授業, ..."
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  2. Readings & Meanings (කොමාවෙන් වෙන් කරන්න: හිරගනා - රෝමාජි - තේරුම)
                </label>
                <textarea
                  rows={4}
                  value={batchReadingsInput}
                  onChange={(e) => setBatchReadingsInput(e.target.value)}
                  placeholder="しゅっせき - shusseki - Attendance, はじめましょう - hajimemashoo - Let's begin, ..."
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  3. Select Matching Images in Order
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setBatchImages(e.target.files)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-gray-50"
                />
              </div>

              {batchProgress && (
                <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> {batchProgress}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
              >
                {saving ? 'Uploading Batch...' : 'Upload All Words to Lesson'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 5: CREATE NEW LESSON
      ===================================================================== */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowLessonModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Lesson</h2>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Lesson Number</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newLessonForm.lesson_number}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, lesson_number: parseInt(e.target.value) || 1 })}
                  className="w-full border rounded-xl p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Lesson Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 入門 - Lesson 01"
                  value={newLessonForm.name}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, name: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl"
              >
                Create Lesson
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyManager;