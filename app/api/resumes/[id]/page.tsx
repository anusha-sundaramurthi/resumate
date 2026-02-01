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
    return <div>Loading...</div>;
  }

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link href="/dashboard" className="back-button">
          <img src="/icons/back.svg" alt="back" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
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
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
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
            <img src="/images/resume-scan-2.gif" className="w-full" alt="analyzing" />
          )}
        </section>
      </div>
    </main>
  );
}