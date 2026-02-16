'use client';

interface CombiliftProductBadgeProps {
  product: string;
}

export default function CombiliftProductBadge({
  product,
}: CombiliftProductBadgeProps) {
  return (
    <span className="inline-flex items-center bg-[var(--accent-orange-muted)] text-[var(--accent-orange)] text-xs font-medium px-2 py-0.5 rounded-full">
      {product}
    </span>
  );
}
