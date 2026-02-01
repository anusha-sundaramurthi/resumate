import type { Feedback } from '@/types';
import ScoreBadge from './ScoreBadge';

interface SummaryProps {
  feedback: Feedback;
}

export default function Summary({ feedback }: SummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-2xl font-bold">Overall Score</h3>
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-2xl">
        <ScoreBadge score={feedback.overallScore} />
      </div>
    </div>
  );
}