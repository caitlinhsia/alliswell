/**
 * A quiet nod to the notebook binding — hairline weight, low contrast, so it
 * reads as a detail at the top edge rather than a drawing of a spiral.
 */
export default function SpiralRings({ count = 8 }: { count?: number }) {
  return (
    <div
      className="absolute -top-2 left-0 right-0 flex justify-around px-6 pointer-events-none"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="10" height="14" viewBox="0 0 16 22" fill="none">
          <path
            d="M2 20C2 8 2 3 8 3C14 3 14 8 14 20"
            stroke="var(--color-paper-line)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </div>
  );
}
