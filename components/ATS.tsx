import ScoreBadge from './ScoreBadge';

interface ATSProps {
  score: number;
  suggestions: {
    type: 'good' | 'improve';
    tip: string;
  }[];
}

export default function ATS({ score, suggestions }: ATSProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">ATS Compatibility</h3>
        <ScoreBadge score={score} />
      </div>
      
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                suggestion.type === 'good'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">
                  {suggestion.type === 'good' ? '✅' : '⚠️'}
                </span>
                <p className="text-sm">{suggestion.tip}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}