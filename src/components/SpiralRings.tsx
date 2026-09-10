/**
 * The binding. Punched holes along the top edge of the sheet — enough to say
 * "torn out of a notebook" without drawing a metal spiral, which is the part
 * that always tips over into looking like a sticker.
 */
export default function SpiralRings({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-[13px] left-0 right-0 z-10 flex justify-between px-[3.5%]"
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-[7px] w-[14px] shrink-0 rounded-full"
          style={{
            background: 'var(--color-ground)',
            boxShadow: 'inset 0 1px 1.5px rgba(38, 35, 29, 0.16)',
          }}
        />
      ))}
    </div>
  );
}
