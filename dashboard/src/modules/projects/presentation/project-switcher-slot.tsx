import { ApiError } from '@/shared/api/http';
import { Button } from '@/shared/ui/button';
import { listProjects } from '../infrastructure/projects.api';
import { ProjectSwitcher } from './project-switcher';

/**
 * The module's server-side entry point for the header. The switcher needs the
 * project list, and the header renders on every route — including /debug, whose
 * entire job is to tell you the API is down. So a dead API degrades to a
 * disabled trigger here instead of taking the whole shell with it.
 *
 * The failure is caught off the promise rather than around the JSX: a
 * try/catch spanning a `return <Component />` would look like it guards the
 * child's rendering, and it does not — only an error boundary does that.
 */
export async function ProjectSwitcherSlot(): Promise<React.ReactElement> {
  const projects = await listProjects().catch((error: unknown) => {
    if (!(error instanceof ApiError)) throw error;
    return error;
  });

  if (projects instanceof ApiError) {
    return (
      <Button variant="outline" disabled title={projects.message}>
        Projects unavailable
      </Button>
    );
  }

  return <ProjectSwitcher projects={projects} />;
}
