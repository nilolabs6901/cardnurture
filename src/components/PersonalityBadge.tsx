'use client';

interface PersonalityBadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
}

const personalityColors: Record<string, { bg: string; text: string }> = {
  Driver: {
    bg: 'rgba(239, 68, 68, 0.12)',
    text: 'var(--personality-driver)',
  },
  Analytical: {
    bg: 'rgba(59, 130, 246, 0.12)',
    text: 'var(--personality-analytical)',
  },
  Expressive: {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: 'var(--personality-expressive)',
  },
  Amiable: {
    bg: 'rgba(16, 185, 129, 0.12)',
    text: 'var(--personality-amiable)',
  },
  Balanced: {
    bg: 'rgba(107, 114, 128, 0.12)',
    text: 'var(--personality-balanced)',
  },
};

const sizeClasses: Record<string, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export default function PersonalityBadge({
  type,
  size = 'md',
}: PersonalityBadgeProps) {
  const colors = personalityColors[type] || personalityColors.Balanced;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {type}
    </span>
  );
}
