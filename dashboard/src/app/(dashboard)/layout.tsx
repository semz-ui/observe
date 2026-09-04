import { AppHeader } from '@/shared/layout/app-header';
import { AppSidebar } from '@/shared/layout/app-sidebar';

export default function DashboardLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex h-dvh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* M2 passes the project switcher in here. */}
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
