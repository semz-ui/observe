import { ThemeToggle } from './theme-toggle';

/**
 * `children` is the slot M2's project switcher drops into. It stays a slot
 * rather than an import so the header has no idea the projects module exists —
 * the shell composes, it doesn't reach into feature modules.
 */
export function AppHeader({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-5">
      {children}
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
