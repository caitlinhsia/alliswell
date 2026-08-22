export type IconName =
  | 'cover'
  | 'flip'
  | 'desk'
  | 'schedule'
  | 'todo'
  | 'study'
  | 'journal'
  | 'notes'
  | 'board'
  | 'sticky'
  | 'mindmap'
  | 'pen'
  | 'mood';

const PATHS: Record<IconName, React.ReactNode> = {
  cover: (
    <>
      <path d="M3 9.5 10 4l7 5.5" />
      <path d="M4.75 8.5V16h10.5V8.5" />
    </>
  ),
  flip: (
    <>
      <path d="M3.5 4.5h5a2 2 0 0 1 2 2v9a1.6 1.6 0 0 0-1.6-1.4H3.5z" />
      <path d="M16.5 4.5h-5a2 2 0 0 0-2 2v9a1.6 1.6 0 0 1 1.6-1.4h5.4z" />
    </>
  ),
  desk: (
    <>
      <rect x="2.5" y="3.5" width="7" height="6" rx="1" />
      <rect x="11" y="3.5" width="6.5" height="9" rx="1" />
      <rect x="2.5" y="11" width="7" height="5.5" rx="1" />
    </>
  ),
  schedule: (
    <>
      <rect x="3" y="4.5" width="14" height="12" rx="1.5" />
      <path d="M3 8h14M7 3v3M13 3v3" />
    </>
  ),
  todo: (
    <>
      <path d="M3.5 6l1.6 1.6L8.2 4.5" />
      <path d="M3.5 13l1.6 1.6 3.1-3.1" />
      <path d="M11 6.2h5.5M11 13.2h5.5" />
    </>
  ),
  study: (
    <>
      <path d="M3 5.2c2.6-1 5-.9 7 .6v9.4c-2-1.5-4.4-1.6-7-.6z" />
      <path d="M17 5.2c-2.6-1-5-.9-7 .6v9.4c2-1.5 4.4-1.6 7-.6z" />
    </>
  ),
  journal: (
    <>
      <path d="M5 3.5h9.5a1 1 0 0 1 1 1v12l-2.2-1.4-2.2 1.4-2.2-1.4L4.7 16.5v-12a1 1 0 0 1 1-1z" />
      <path d="M7.5 7h5M7.5 10h5" />
    </>
  ),
  notes: (
    <>
      <rect x="4" y="3" width="12" height="14" rx="1.2" />
      <path d="M7 7h6M7 10h6M7 13h3.5" />
    </>
  ),
  board: (
    <>
      <rect x="3" y="3.5" width="14" height="13" rx="1.2" />
      <path d="M11.5 16.5V12H17" />
    </>
  ),
  sticky: (
    <>
      <path d="M4 3.5h12v8.5l-4 4.5H4z" />
      <path d="M16 12h-4v4.5" />
    </>
  ),
  mindmap: (
    <>
      <circle cx="10" cy="10" r="2.6" />
      <circle cx="16.2" cy="4.6" r="1.7" />
      <circle cx="3.8" cy="5.6" r="1.7" />
      <circle cx="15.4" cy="15.6" r="1.7" />
      <path d="M11.9 8.2 14.9 5.7M8 8.8 5.3 6.7M11.8 11.7l2.4 2.7" />
    </>
  ),
  pen: (
    <>
      <path d="M13.4 3.6 16.4 6.6 7 16H4v-3z" />
      <path d="M11.8 5.2 14.8 8.2" />
    </>
  ),
  mood: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M7.2 11.6c.7 1 1.7 1.5 2.8 1.5s2.1-.5 2.8-1.5" />
      <path d="M7.6 7.8h.01M12.4 7.8h.01" />
    </>
  ),
};

export default function Icon({
  name,
  className = '',
  size = 16,
}: {
  name: IconName;
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`inline-block shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
