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
      className={`bg-[var(--color-paper)] rounded-sm border border-[var(--color-paper-line)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}
