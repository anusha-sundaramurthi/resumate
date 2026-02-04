'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { generateStyledResumePDF } from '@/lib/resumeGenerator';

interface ResumeData {
  id: string;
  resumePath: string;
  imagePath: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  feedback: {
    overallScore?: number;
  };
}

export default function ResumeOptimizerPage() {
  const params = useParams();
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const id = params?.id as string;
  
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    const fetchResumeData = async () => {
      if (!userId || !id) return;
      
      try {
        const response = await fetch(`/api/resumes/${id}`);
        if (response.ok) {
          const data = await response.json();
          setResumeData(data);
        }
      } catch (err) {
        setError('Failed to load resume data');
      }
    };

    if (userId) {
      fetchResumeData();
    }
  }, [id, userId]);

  const handleOptimizeResume = async () => {
    if (!resumeData) return;

    if (!resumeData.jobTitle || !resumeData.jobDescription) {
      setError('Job title and job description are required for optimization.');
      return;
    }

    setIsOptimizing(true);
    setStatusText('Generating optimized resume... (this may take 20-30 seconds)');
    setError('');

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: id }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to generate optimized resume');
        setStatusText('');
        setIsOptimizing(false);
        return;
      }

      setOptimizedResume(result.optimizedContent);
      setStatusText('Optimization complete! Ready to download.');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Optimization failed: ${errorMsg}`);
      setStatusText('');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!optimizedResume || !resumeData) return;

    setIsDownloading(true);
    setStatusText('Generating PDF...');

    try {
      await generateStyledResumePDF(
        optimizedResume,
        resumeData.resumePath.split('/').pop() || 'resume.pdf',
        {
          jobTitle: resumeData.jobTitle,
          companyName: resumeData.companyName,
        }
      );
      setStatusText('PDF downloaded successfully!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Download failed';
      setError(errorMsg);
      setStatusText('');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isLoaded || !userId || !resumeData) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold mb-2 text-gradient">Resume Optimizer</h1>
          <h2 className="text-xl text-gray-600 mb-8">Generate your ATS-optimized resume</h2>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Details</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Company:</strong> {resumeData.companyName}</p>
              <p><strong>Position:</strong> {resumeData.jobTitle}</p>
              <p><strong>Current ATS Score:</strong> {resumeData.feedback?.overallScore || 'N/A'}/100</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {statusText && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
              {statusText}
            </div>
          )}

          {!optimizedResume && (
            <button
              onClick={handleOptimizeResume}
              disabled={isOptimizing}
              className="primary-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOptimizing ? 'Optimizing... Please wait' : '✨ Generate Optimized Resume'}
            </button>
          )}

          {optimizedResume && (
            <>
              <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto border-2 border-gray-300 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Optimized Resume Preview
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed font-mono">
                  {optimizedResume}
                </div>
              </div>

              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="primary-button w-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDownloading ? 'Generating PDF...' : (
                  <>
                    <span>📥</span>
                    <span>Download as PDF</span>
                  </>
                )}
              </button>

              <button
                onClick={() => router.back()}
                className="w-full text-center py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                ← Back to Analysis
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}