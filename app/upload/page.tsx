'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FileUploader from '@/components/FileUploader';
import { convertPdfToImage, convertFileToImage } from '@/lib/pdf2img';

export default function UploadPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  if (isLoaded && !userId) {
    router.push('/sign-in');
    return null;
  }

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
  };

  const getFileType = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert('Please upload a resume file');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData(e.currentTarget);
      const companyName = formData.get('company-name') as string;
      const jobTitle = formData.get('job-title') as string;
      const jobDescription = formData.get('job-description') as string;

      setStatusText('Converting to image...');
      const fileType = getFileType(file.name);
      let imageFile;

      if (fileType === 'pdf') {
        imageFile = await convertPdfToImage(file);
      } else {
        imageFile = await convertFileToImage(file);
      }

      if (!imageFile.file) {
        setStatusText('Error: Failed to convert file to image');
        setIsProcessing(false);
        return;
      }

      setStatusText('Uploading and analyzing...');

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('imageFile', imageFile.file);
      uploadData.append('companyName', companyName || 'Not Specified');
      uploadData.append('jobTitle', jobTitle || 'General Position');
      uploadData.append('jobDescription', jobDescription || 'General resume optimization');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const result = await response.json();

      if (!response.ok) {
        setStatusText(`Error: ${result.error}`);
        setIsProcessing(false);
        return;
      }

      setStatusText('Analysis complete, redirecting...');
      router.push(`/resume/${result.resumeId}`);
    } catch (error) {
      console.error('Upload error:', error);
      setStatusText(`Error: ${error instanceof Error ? error.message : 'Upload failed'}`);
      setIsProcessing(false);
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart Feedback for Your Dream Job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" alt="Processing" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}
          {!isProcessing && (
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
              <div className="form-div">
                <label htmlFor="company-name">Company Name (Optional)</label>
                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title (Optional)</label>
                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description (Optional)</label>
                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}