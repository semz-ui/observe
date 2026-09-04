import { ProjectSwitcherSlot } from '@/modules/projects';
import { AppHeader } from '@/shared/layout/app-header';
import { AppSidebar } from '@/shared/layout/app-sidebar';
import { QueryProvider } from '@/shared/query/query-provider';

export default function DashboardLayout({ children }: LayoutProps<'/'>) {
  return (
    <QueryProvider>
      <div className="flex h-dvh">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader>
            <ProjectSwitcherSlot />
          </AppHeader>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </QueryProvider>
  );
}
