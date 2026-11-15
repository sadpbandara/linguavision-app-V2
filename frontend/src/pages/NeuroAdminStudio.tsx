import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Plus, Upload, Trash2, CheckCircle2, AlertTriangle,
  ArrowLeft, Image as ImageIcon, ShieldAlert, Sparkles, Loader2, X
} from 'lucide-react';
import api from '../services/api';

interface NeuroImage {
  id: string;
  image_url: string;
  classification: 'EXACT' | 'CONTEXTUAL' | 'SEMANTIC_DISTRACTOR' | 'VISUAL_CONFUSER';
  is_correct: boolean;
  concept_label: string;
  explanation: string;
}

interface NeuroVocab {
  id: string;
  word: string;
  reading: string;
  romaji: string;
  word_type: string;
  core_meaning: string;
  semantic_category: string;
  example_sentence: string;
  neuro_images: NeuroImage[];
  correct_image_count: number;
  distractor_image_count: number;
  is_game_ready: boolean;
}

const CLASSIFICATION_META = {
  EXACT: {
    label: 'A. Exact Semantic Match (නිවැරදි සෘජු රූපය)',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: 'ඉලක්කගත වචනය සෘජුවම පෙන්වන විවිධ පෙනුමැති රූප (උදා: ලී පඩිපෙළ, ගල් පඩිපෙළ).'
  },
  CONTEXTUAL: {
    label: 'B. Contextual Match (නිවැරදි අවස්ථානුකූල රූපය)',
    badge: 'bg-teal-100 text-teal-800 border-teal-300',
    desc: 'සැබෑ ජීවිතයේ එම සංකල්පය භාවිතා වන අවස්ථාවක් (උදා: පඩිපෙළක් නගින පුද්ගලයෙක්).'
  },
  SEMANTIC_DISTRACTOR: {
    label: 'C. Semantic Distractor (වැරදි නමුත් සමීප රූපය)',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'තේරුමෙන් සමීප නමුත් මෙම වචනය නොවන දේවල් (උදා: පඩිපෙළ සඳහා ඉණිමඟ හෝ Escalator).'
  },
  VISUAL_CONFUSER: {
    label: 'D. Visual Confuser (පෙනුමෙන් සමාන වැරදි රූපය)',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    desc: 'හැඩයෙන් සමාන හෝ ශිෂ්‍යයා නොමඟ යැවිය හැකි වෙනත් රූප.'
  }
};

const NeuroAdminStudio: React.FC = () => {
  const navigate = useNavigate();
  const [vocabList, setVocabList] = useState<NeuroVocab[]>([]);
  const [selectedVocab, setSelectedVocab] = useState<NeuroVocab | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New word modal state
  const [showNewWordModal, setShowNewWordModal] = useState(false);
  const [newWord, setNewWord] = useState({
    word: '',
    reading: '',
    romaji: '',
    word_type: 'noun',
    core_meaning: '',
    semantic_category: 'Architecture & Objects',
    example_sentence: ''
  });

  // Image upload form state
  const [classification, setClassification] = useState<'EXACT' | 'CONTEXTUAL' | 'SEMANTIC_DISTRACTOR' | 'VISUAL_CONFUSER'>('EXACT');
  const [conceptLabel, setConceptLabel] = useState('');
  const [explanation, setExplanation] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const fetchStudioData = async (keepSelectedId?: string) => {
    try {
      const res = await api.get('learning/neuro/vocab/');
      setVocabList(res.data);
      if (keepSelectedId) {
        const found = res.data.find((v: NeuroVocab) => v.id === keepSelectedId);
        if (found) setSelectedVocab(found);
      } else if (res.data.length > 0 && !selectedVocab) {
        setSelectedVocab(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load Neuro Studio data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudioData();
  }, []);

  const handleCreateWord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(newWord).forEach(([k, v]) => formData.append(k, v));
      const audioInput = document.getElementById('neuroAudioInput') as HTMLInputElement;
      if (audioInput?.files?.[0]) {
        formData.append('audio_file', audioInput.files[0]);
      }

      const res = await api.post('learning/neuro/vocab/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowNewWordModal(false);
      setNewWord({
        word: '', reading: '', romaji: '', word_type: 'noun',
        core_meaning: '', semantic_category: 'General', example_sentence: ''
      });
      await fetchStudioData(res.data.id);
    } catch (err) {
      alert('Failed to create vocabulary.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVocab || !selectedFiles || selectedFiles.length === 0) {
      return alert('කරුණාකර පින්තූර එකක් හෝ කිහිපයක් තෝරන්න.');
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('classification', classification);
    formData.append('concept_label', conceptLabel);
    formData.append('explanation', explanation);
    Array.from(selectedFiles).forEach(file => {
      formData.append('images', file);
    });

    try {
      await api.post(`learning/neuro/vocab/${selectedVocab.id}/images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setConceptLabel('');
      setExplanation('');
      setSelectedFiles(null);
      const fileInput = document.getElementById('neuroImageFiles') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await fetchStudioData(selectedVocab.id);
    } catch (err) {
      alert('Image upload failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!selectedVocab || !window.confirm('මෙම පින්තූරය ඉවත් කරන්නද?')) return;
    try {
      await api.delete(`learning/neuro/vocab/${selectedVocab.id}/images/${imageId}/`);
      await fetchStudioData(selectedVocab.id);
    } catch (err) {
      alert('Failed to delete image.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl">
              <BrainCircuit className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                NeuroRecall Admin Studio
                <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                  Visual Semantic Lab
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                එක් වචනයකට නිවැරදි පින්තූර කිහිපයක් සහ ව්‍යාකූල කරන (Distractor) පින්තූර එක් කරන්න
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewWordModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 text-sm shadow-sm transition"
            >
              <Plus className="h-4 w-4" /> Add New Word
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl flex items-center gap-2 text-sm transition"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Vocabulary List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[82vh]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Vocabulary Bank ({vocabList.length})</h2>
            <span className="text-xs text-slate-500">Min: 2 Correct + 2 Distractors</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {vocabList.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVocab(v)}
                className={`w-full text-left p-4 transition flex items-center justify-between hover:bg-indigo-50/40 ${
                  selectedVocab?.id === v.id ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : ''
                }`}
              >
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900">{v.word}</span>
                    <span className="text-sm text-indigo-600 font-semibold">{v.reading}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {v.core_meaning || 'No core meaning set'} • <span className="uppercase">{v.word_type}</span>
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {v.is_game_ready ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">
                      <AlertTriangle className="h-3 w-3" /> Needs Images
                    </span>
                  )}
                  <div className="text-[11px] text-slate-500 font-medium">
                    <span className="text-emerald-600 font-bold">{v.correct_image_count}✓</span>
                    {' / '}
                    <span className="text-rose-600 font-bold">{v.distractor_image_count}✗</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Selected Word Image Classification Lab */}
        <div className="lg:col-span-8 space-y-6">
          {selectedVocab ? (
            <>
              {/* Word Header Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-4xl font-black text-slate-900">{selectedVocab.word}</h2>
                    <div>
                      <p className="text-lg font-bold text-indigo-600">{selectedVocab.reading}</p>
                      <p className="text-xs text-slate-400 uppercase font-bold">{selectedVocab.semantic_category}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    <strong>Core Concept (Admin Reference):</strong> {selectedVocab.core_meaning || 'Not specified'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-center">
                    <p className="text-xs text-emerald-700 font-bold">Correct (A+B)</p>
                    <p className="text-2xl font-black text-emerald-800">{selectedVocab.correct_image_count}</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-center">
                    <p className="text-xs text-rose-700 font-bold">Distractors (C+D)</p>
                    <p className="text-2xl font-black text-rose-800">{selectedVocab.distractor_image_count}</p>
                  </div>
                </div>
              </div>

              {/* Multi-Image Upload Form */}
              <form onSubmit={handleUploadImages} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-indigo-600" />
                  Upload Classified Images for "{selectedVocab.word}"
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(Object.keys(CLASSIFICATION_META) as Array<keyof typeof CLASSIFICATION_META>).map(key => (
                    <label
                      key={key}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        classification === key
                          ? 'border-indigo-600 bg-indigo-50/60'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="classification"
                          value={key}
                          checked={classification === key}
                          onChange={() => setClassification(key)}
                          className="text-indigo-600"
                        />
                        <span className="font-bold text-xs text-slate-800">{CLASSIFICATION_META[key].label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 pl-5">{CLASSIFICATION_META[key].desc}</p>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Visual Concept Label (උදා: "Spiral staircase" හෝ "Wooden ladder")
                    </label>
                    <input
                      type="text"
                      required
                      value={conceptLabel}
                      onChange={e => setConceptLabel(e.target.value)}
                      placeholder="What does this specific image show?"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Image File(s) (පින්තූර එකක් හෝ කිහිපයක්)
                    </label>
                    <input
                      id="neuroImageFiles"
                      type="file"
                      accept="image/*"
                      multiple
                      required
                      onChange={e => setSelectedFiles(e.target.files)}
                      className="w-full border border-slate-300 rounded-xl p-2 text-sm bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cognitive Feedback Explanation (ශිෂ්‍යයාට පිළිතුර පෙන්වන විට ලබා දෙන පැහැදිලි කිරීම)
                  </label>
                  <input
                    type="text"
                    value={explanation}
                    onChange={e => setExplanation(e.target.value)}
                    placeholder="උදා: ඉණිමඟ (梯子 - hashigo) යනු පඩිපෙළක් (階段) නොවේ."
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  Upload & Classify Image(s)
                </button>
              </form>

              {/* Image Gallery Grouped by Classification */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-indigo-600" />
                  Image Pool for {selectedVocab.word} ({selectedVocab.neuro_images.length} total)
                </h3>

                {selectedVocab.neuro_images.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                    තවමත් මෙම වචනයට NeuroRecall පින්තූර එක් කර නැත. ඉහත පෝරමයෙන් නිවැරදි සහ Distractor පින්තූර එක් කරන්න.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedVocab.neuro_images.map(img => (
                      <div
                        key={img.id}
                        className={`rounded-xl border-2 overflow-hidden flex flex-col justify-between bg-white shadow-sm ${
                          img.is_correct ? 'border-emerald-200' : 'border-rose-200'
                        }`}
                      >
                        <div className="relative h-36 bg-slate-100 flex items-center justify-center">
                          <img
                            src={img.image_url}
                            alt={img.concept_label}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className={`absolute top-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                              CLASSIFICATION_META[img.classification].badge
                            }`}
                          >
                            {img.classification.replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => handleDeleteImage(img.id)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-bold text-slate-800 truncate">{img.concept_label}</p>
                          {img.explanation && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{img.explanation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
              වම් පස ලැයිස්තුවෙන් වචනයක් තෝරන්න හෝ අලුත් වචනයක් එක් කරන්න.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create New Vocabulary */}
      {showNewWordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowNewWordModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Vocabulary to NeuroRecall</h2>
            <form onSubmit={handleCreateWord} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kanji / Word *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 階段"
                    value={newWord.word}
                    onChange={e => setNewWord({ ...newWord, word: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hiragana / Reading *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., かいだん"
                    value={newWord.reading}
                    onChange={e => setNewWord({ ...newWord, reading: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Core Concept Meaning *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Staircase / Steps"
                    value={newWord.core_meaning}
                    onChange={e => setNewWord({ ...newWord, core_meaning: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semantic Category</label>
                  <input
                    type="text"
                    placeholder="e.g., Architecture"
                    value={newWord.semantic_category}
                    onChange={e => setNewWord({ ...newWord, semantic_category: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Part of Speech</label>
                  <select
                    value={newWord.word_type}
                    onChange={e => setNewWord({ ...newWord, word_type: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm bg-white"
                  >
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="i-adjective">I-Adjective</option>
                    <option value="na-adjective">Na-Adjective</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Audio File (Optional)</label>
                  <input id="neuroAudioInput" type="file" accept="audio/*" className="w-full text-xs pt-2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-3 hover:bg-indigo-700"
              >
                {saving ? 'Saving...' : 'Create Word & Start Adding Images'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeuroAdminStudio;