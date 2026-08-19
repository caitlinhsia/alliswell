import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

const NAV = [
  { to: '/', label: 'Home', color: 'var(--color-tab-lavender)', emoji: '🏠' },
  { to: '/schedule', label: 'Schedule', color: 'var(--color-tab-sky)', emoji: '🗓️' },
  { to: '/study', label: 'Study', color: 'var(--color-tab-sage)', emoji: '📚' },
  { to: '/journal', label: 'Journal', color: 'var(--color-tab-blush)', emoji: '📝' },
  { to: '/notes', label: 'Sticky Notes', color: 'var(--color-tab-butter)', emoji: '📌' },
];

export default function Sidebar() {
  const userName = useAppStore((s) => s.userName);
  return (
    <nav className="flex md:flex-col shrink-0 md:w-52 border-b md:border-b-0 md:border-r border-[var(--color-paper-line)] bg-[var(--color-paper-deep)]/60">
      <div className="hidden md:block px-5 pt-6 pb-4">
        <h1 className="font-hand text-3xl leading-none text-[var(--color-ink)]">
          all is well
        </h1>
        {userName && <p className="font-hand text-lg text-[var(--color-ink-soft)]">with {userName}</p>}
      </div>
      <ul className="flex md:flex-col flex-1 md:gap-1 md:px-3 md:pb-6">
        {NAV.map((item) => (
          <li key={item.to} className="flex-1 md:flex-none">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-2 md:gap-3 justify-center md:justify-start',
                  'h-full md:h-auto px-2 md:px-4 py-2.5 md:py-3 rounded-none md:rounded-r-xl',
                  'font-note text-sm md:text-base transition-all duration-150',
                  'border-t-4 md:border-t-0 md:border-l-4',
                  isActive
                    ? 'bg-[var(--color-paper)] shadow-sm text-[var(--color-ink)]'
                    : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-paper)]/60',
                ].join(' ')
              }
              style={({ isActive }) => ({
                borderColor: isActive ? item.color : 'transparent',
              })}
            >
              <span aria-hidden className="text-lg">
                {item.emoji}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
