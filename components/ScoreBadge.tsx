interface ScoreBadgeProps {
  score: number;
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  const getColorClass = (score: number) => {
    if (score >= 80) return 'bg-badge-green text-badge-green-text';
    if (score >= 60) return 'bg-badge-yellow text-badge-yellow-text';
    return 'bg-badge-red text-badge-red-text';
  };

  return (
    <div className={`score-badge ${getColorClass(score)}`}>
      <span className="text-2xl font-bold">{score}</span>
      <span className="text-sm">/100</span>
    </div>
  );
}