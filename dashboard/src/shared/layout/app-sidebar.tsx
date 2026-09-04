'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import { cn } from '@/shared/lib/utils';
import { NAV_ITEMS } from './nav-items';

export function AppSidebar(): React.ReactElement {
  const pathname = usePathname();
  const params = useParams();
  const projectId =
    typeof params.projectId === 'string' ? params.projectId : null;

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center px-5 text-sm font-semibold tracking-tight">
        observe
      </div>
      <nav className="flex flex-col gap-0.5 px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const {
            label,
            icon: Icon,
            milestone,
            available,
            requiresProject,
          } = item;
          const href = item.href(projectId);

          const className = cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
            href === null
              ? 'cursor-not-allowed text-sidebar-foreground/40'
              : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          );

          if (href === null) {
            return (
              <span
                key={label}
                className={className}
                aria-disabled
                // An unbuilt route is unbuilt whether or not a project is in
                // scope, so that reason wins.
                title={
                  !available
                    ? `Not built yet — arrives in ${milestone}`
                    : requiresProject && projectId === null
                      ? 'Choose a project first'
                      : undefined
                }
              >
                <Icon className="size-4" />
                {label}
              </span>
            );
          }

          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={label}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                className,
                isActive &&
                  'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
