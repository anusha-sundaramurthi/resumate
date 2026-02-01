import type { Feedback } from '@/types';
import Accordion from './Accordion';

interface DetailsProps {
  feedback: Feedback;
}

export default function Details({ feedback }: DetailsProps) {
  const sections = [
    {
      title: 'Tone and Style',
      score: feedback.toneAndStyle.score,
      tips: feedback.toneAndStyle.tips,
    },
    {
      title: 'Content',
      score: feedback.content.score,
      tips: feedback.content.tips,
    },
    {
      title: 'Structure',
      score: feedback.structure.score,
      tips: feedback.structure.tips,
    },
    {
      title: 'Skills',
      score: feedback.skills.score,
      tips: feedback.skills.tips,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-2xl font-bold">Detailed Feedback</h3>
      
      {sections.map((section, index) => (
        <Accordion
          key={index}
          title={section.title}
          score={section.score}
          tips={section.tips}
        />
      ))}
    </div>
  );
}