'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Summary from '@/components/Summary';
import ATS from '@/components/ATS';
import Details from '@/components/Details';
import type { Feedback } from '@/types';

export default function ResumePage() {
  const { userId, isLoaded } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [imageUrl, setImageUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push(`/sign-in?redirect_url=/resume/${id}`);
    }
  }, [isLoaded, userId, id, router]);

  useEffect(() => {
    const loadResume = async () => {
      if (!userId || !id) return;

      try {
        const response = await fetch(`/api/resumes/${id}`);
        if (!response.ok) {
          console.error('Failed to load resume');
          return;
        }

        const data = await response.json();
        
        setResumeUrl(data.resumePath);
        setImageUrl(data.imagePath);
        setFeedback(data.feedback);
      } catch (error) {
        console.error('Error loading resume:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadResume();
    }
  }, [id, userId]);

  if (!isLoaded || !userId || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link href="/dashboard" className="back-button">
          <span className="text-gray-800 text-sm font-semibold">← Back to Dashboard</span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-gradient-to-b from-purple-50 to-blue-50 h-[100vh] sticky top-0 flex items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  alt="resume preview"
                />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold mb-6">Resume Review</h2>
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
              <Details feedback={feedback} />

              <button
                onClick={() => router.push(`/resume/${id}/optimize`)}
                className="primary-button w-full mt-4"
              >
                Get Optimized Resume
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">AI is analyzing your resume...</p>
              <p className="text-sm text-gray-500 mt-2">This may take 10-20 seconds</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
