'use client';

import { useState, useRef } from 'react';
import { formatSize } from '@/lib/utils';

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
}

export default function FileUploader({ onFileSelect }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleInputChange}
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
      />
      
      {!selectedFile ? (
        <div
          className={`uplader-drag-area border-2 border-dashed ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center gap-4">
            <img src="/icons/upload.svg" alt="upload" className="w-12 h-12" />
            <p className="text-gray-600">
              Drag and drop your resume here, or click to browse
            </p>
            <p className="text-sm text-gray-400">
              Supports PDF, DOC, DOCX, TXT
            </p>
          </div>
        </div>
      ) : (
        <div className="uploader-selected-file">
          <div className="flex items-center gap-3">
            <img src="/icons/file.svg" alt="file" className="w-8 h-8" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleFileChange(null)}
            className="text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}