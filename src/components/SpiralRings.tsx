export default function SpiralRings({ count = 8 }: { count?: number }) {
  return (
    <div
      className="absolute -top-3 left-0 right-0 flex justify-around px-4 pointer-events-none"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="16" height="22" viewBox="0 0 16 22" fill="none">
          <path
            d="M2 20C2 8 2 3 8 3C14 3 14 8 14 20"
            stroke="#a99a86"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </div>
  );
}
