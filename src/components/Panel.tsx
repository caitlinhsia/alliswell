import type { ReactNode } from 'react';

export default function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[var(--color-paper)] rounded-2xl border border-[var(--color-paper-line)] shadow-[0_2px_10px_rgba(51,41,31,0.06)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}
