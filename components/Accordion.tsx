'use client';

import { useState } from 'react';
import ScoreBadge from './ScoreBadge';

interface AccordionProps {
  title: string;
  score: number;
  tips: {
    type: 'good' | 'improve';
    tip: string;
    explanation?: string;
  }[];
}

export default function Accordion({ title, score, tips }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <ScoreBadge score={score} />
          <span className="text-2xl">{isOpen ? '−' : '+'}</span>
        </div>
      </button>
      
      {isOpen && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col gap-3">
            {tips.map((tip, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg bg-white ${
                  tip.type === 'good'
                    ? 'border border-green-200'
                    : 'border border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">
                    {tip.type === 'good' ? '✅' : '⚠️'}
                  </span>
                  <p className="font-semibold">{tip.tip}</p>
                </div>
                {tip.explanation && (
                  <p className="text-sm text-gray-600 ml-7">{tip.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}