import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { UploadCloud, Download, FileSpreadsheet, FileArchive, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const ImportCenter = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [languages, setLanguages] = useState<any[]>([]);

  const { register, handleSubmit, reset } = useForm();

  // භාෂා ලැයිස්තුව ලබා ගැනීම
  useEffect(() => {
    api.get('languages/').then(res => setLanguages(res.data)).catch(err => console.error(err));
  }, []);

  const downloadTemplate = (type: 'excel' | 'zip') => {
    window.location.href = `http://127.0.0.1:8000/api/v1/imports/template/${type}/`;
  };

  const onSubmit = async (data: any) => {
    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('language', data.language); // තෝරාගත් භාෂාවේ ID එක
    formData.append('excel_file', data.excel_file[0]);
    formData.append('zip_file', data.zip_file[0]);

    try {
      await api.post('imports/jobs/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus({ type: 'success', message: 'Files uploaded successfully! Processing started in the background.' });
      reset();
    } catch (error: any) {
      setUploadStatus({ type: 'error', message: 'Failed to upload files. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Import Center</h1>
            <p className="text-gray-500 mt-1">Upload vocabulary and media in bulk using Excel and ZIP files.</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
            Back to Dashboard
          </button>
        </div>

        {/* Templates Section */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" /> Step 1: Download Templates
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => downloadTemplate('excel')} className="flex-1 flex items-center justify-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 hover:bg-green-100 transition">
              <FileSpreadsheet className="h-6 w-6" />
              <div className="text-left"><div className="font-bold">Excel Template</div></div>
            </button>
            <button onClick={() => downloadTemplate('zip')} className="flex-1 flex items-center justify-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 hover:bg-orange-100 transition">
              <FileArchive className="h-6 w-6" />
              <div className="text-left"><div className="font-bold">ZIP Structure</div></div>
            </button>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" /> Step 2: Upload Files
          </h2>

          {uploadStatus && (
            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${uploadStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {uploadStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
              <p>{uploadStatus.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Language</label>
              <select {...register('language', { required: true })} className="block w-full border border-gray-300 rounded-lg p-2.5 bg-white">
                <option value="">-- Choose a language --</option>
                {languages.map(lang => (
                  <option key={lang.id} value={lang.id}>{lang.name} ({lang.native_name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vocabulary Excel File (.xlsx)</label>
              <input type="file" accept=".xlsx, .xls" {...register('excel_file', { required: true })} className="block w-full text-sm text-gray-500 border border-gray-200 rounded-lg" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Media ZIP File (.zip)</label>
              <input type="file" accept=".zip" {...register('zip_file', { required: true })} className="block w-full text-sm text-gray-500 border border-gray-200 rounded-lg" />
            </div>

            <button type="submit" disabled={isUploading} className="w-full flex justify-center py-3 px-4 rounded-lg font-bold text-white bg-primary hover:bg-indigo-700 transition">
              {isUploading ? <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Processing...</> : 'Start Import Process'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImportCenter;