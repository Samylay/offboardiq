import clsx from 'clsx';

export default function RiskBadge({ score, size = 'md' }) {
  const level = score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';
  const label = level.charAt(0).toUpperCase() + level.slice(1);

  const colors = {
    critical: 'bg-red-100 text-red-800 ring-red-200',
    high: 'bg-orange-100 text-orange-800 ring-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
    low: 'bg-green-100 text-green-800 ring-green-200',
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full ring-1 font-medium',
      colors[level],
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      <span className={clsx(
        'rounded-full',
        size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
        level === 'critical' ? 'bg-red-500' :
        level === 'high' ? 'bg-orange-500' :
        level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
      )} />
      {Math.round(score)} — {label}
    </span>
  );
}
