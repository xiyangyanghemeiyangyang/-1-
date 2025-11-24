import React, { useCallback, useState } from 'react';
import { UploadCloud, Music, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    // 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      setError("File is too large. Max 100MB.");
      return false;
    }
    if (!file.type.startsWith('audio/')) {
      setError("Please upload a valid audio file.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group cursor-pointer border-2 border-dashed rounded-2xl p-10 transition-all duration-300
          flex flex-col items-center justify-center gap-4
          ${isDragging 
            ? 'border-brand-500 bg-brand-500/10 scale-[1.02]' 
            : 'border-gray-600 hover:border-brand-400 hover:bg-dark-800'
          }
          ${error ? 'border-red-500 bg-red-500/10' : ''}
        `}
      >
        <input
          type="file"
          accept="audio/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
        />
        
        <div className={`p-4 rounded-full ${isDragging ? 'bg-brand-500 text-white' : 'bg-dark-800 text-brand-500'} transition-colors`}>
          <UploadCloud size={40} />
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-100">
            {isDragging ? 'Drop it here!' : 'Click or Drag audio file'}
          </h3>
          <p className="text-gray-400 mt-2 text-sm">
            MP3, WAV, FLAC, M4A up to 100MB
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 animate-pulse">
          <X size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
