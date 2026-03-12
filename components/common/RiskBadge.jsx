'use client';

import clsx from 'clsx';

const levels = {
  low: { label: 'Low', className: 'bg-green-100 text-green-800' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critical', className: 'bg-red-100 text-red-800' },
};

function getRiskLevel(score) {
  if (score < 30) return 'low';
  if (score < 60) return 'medium';
  if (score < 80) return 'high';
  return 'critical';
}

export default function RiskBadge({ score, size = 'md' }) {
  const level = getRiskLevel(score);
  const { label, className } = levels[level];

  return (
    <span className={clsx(
      'inline-flex items-center font-semibold rounded-full',
      className,
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
    )}>
      {Math.round(score)} — {label}
    </span>
  );
}
