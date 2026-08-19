export default function PageHeader({
  title,
  subtitle,
  emoji,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
}) {
  return (
    <header className="mb-6">
      <h2 className="font-sans font-extrabold text-3xl md:text-4xl text-[var(--color-ink)] flex items-center gap-3">
        {emoji && <span className="text-2xl md:text-3xl">{emoji}</span>}
        {title}
      </h2>
      {subtitle && (
        <p className="font-hand text-xl text-[var(--color-ink-soft)] mt-1">{subtitle}</p>
      )}
    </header>
  );
}
