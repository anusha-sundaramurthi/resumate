'use client';

import Link from 'next/link';
import type { Resume } from '@/types';
import ScoreBadge from './ScoreBadge';

interface ResumeCardProps {
  resume: Resume;
}

export default function ResumeCard({ resume }: ResumeCardProps) {
  return (
    <div className="resume-card">
      <div className="resume-card-header">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">{resume.companyName || 'Company'}</h3>
          <p className="text-gray-600">{resume.jobTitle || 'Position'}</p>
        </div>
        <ScoreBadge score={resume.feedback?.overallScore || 0} />
      </div>
      
      <Link href={`/resume/${resume.id}`} className="block">
        <img
          src={resume.imagePath}
          alt={`Resume for ${resume.companyName}`}
          className="w-full h-64 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition"
        />
      </Link>
      
      <Link href={`/resume/${resume.id}`} className="primary-button text-center">
        View Details
      </Link>
    </div>
  );
}