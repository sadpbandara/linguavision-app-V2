import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Globe, Plus, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Language {
  id: string;
  name: string;
  native_name: string;
  iso_code: string;
  writing_direction: string;
}

const LanguageManager = () => {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const { register, handleSubmit, reset } = useForm();

const fetchLanguages = async () => {
    try {
      const response = await api.get('languages/');
      console.log("Backend Data:", response.data); // දත්ත එන ආකාරය බැලීමට
      setLanguages(response.data.results ? response.data.results : response.data);
    } catch (error) {
      console.error("Error fetching languages", error);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  // අලුත් භාෂාවක් එකතු කිරීම
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await api.post('languages/', data);
      reset(); // Form එක හිස් කිරීම
      fetchLanguages(); // ලැයිස්තුව යාවත්කාලීන කිරීම
    } catch (error) {
      console.error("Error adding language", error);
      alert("Failed to add language. Make sure the ISO code is unique.");
    } finally {
      setIsLoading(false);
    }
  };

  // භාෂාවක් ඉවත් කිරීම
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this language?')) {
      try {
        await api.delete(`languages/${id}/`);
        fetchLanguages();
      } catch (error) {
        console.error("Error deleting language", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" /> Language Management
            </h1>
            <p className="text-gray-500 mt-1">Add and manage languages for the learning platform.</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add New Language Form */}
          <div className="lg:col-span-1">
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Add New Language
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language Name (English)</label>
                  <input type="text" placeholder="e.g., Japanese" {...register('name', { required: true })} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Native Name</label>
                  <input type="text" placeholder="e.g., 日本語" {...register('native_name', { required: true })} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISO Code</label>
                  <input type="text" placeholder="e.g., ja" {...register('iso_code', { required: true, maxLength: 10 })} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Writing Direction</label>
                  <select {...register('writing_direction')} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-primary focus:border-primary bg-white">
                    <option value="LTR">Left to Right (LTR)</option>
                    <option value="RTL">Right to Left (RTL)</option>
                  </select>
                </div>
                
                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition mt-6">
                {isLoading ? (
                    <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> 
                    Saving...
                    </>
                ) : (
                    'Save Language'
                )}
                </button>
              </form>
            </div>
          </div>

          {/* Languages List */}
          <div className="lg:col-span-2">
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Active Languages</h2>
              
              {fetchLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : languages.length === 0 ? (
                <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  No languages added yet. Add your first language using the form.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {languages.map((lang) => (
                    <div key={lang.id} className="p-4 border border-gray-200 rounded-xl flex justify-between items-start hover:border-primary hover:shadow-md transition bg-white">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{lang.name}</h3>
                        <p className="text-gray-500 font-medium">{lang.native_name}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-semibold uppercase">{lang.iso_code}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-semibold">{lang.writing_direction}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(lang.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LanguageManager;