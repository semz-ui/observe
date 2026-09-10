'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/shared/api/http';
import type { CreateProjectState } from './create-project-state';
import { projectNameSchema, type CreatedProject } from '../domain/project';
import { createProject } from '../infrastructure/projects.api';

/**
 * Generated from the new key rather than copied from the SDK README, so what the
 * reader pastes is already correct for their project.
 *
 * `apiHost` is taken from OBSERVE_API_URL, which is the address *this server*
 * uses. In a real deployment the browser-facing ingestion host may differ from
 * the dashboard's internal one; when that day comes this needs its own public
 * env var rather than borrowing this one.
 */
function installSnippet(apiKey: string): string {
  const apiHost = process.env.OBSERVE_API_URL ?? 'https://your-observe-host';

  return [
    '<script src="https://unpkg.com/@semz-ui/observe-sdk/dist/index.global.js"></script>',
    '<script>',
    `  Observe.init({ apiKey: '${apiKey}', apiHost: '${apiHost}' });`,
    '</script>',
  ].join('\n');
}

/**
 * A Server Action rather than a route handler: the form posts straight to the
 * server, which calls the API and revalidates the list. There is no client cache
 * holding projects, so there is nothing to invalidate by hand.
 */
export async function createProjectAction(
  _previous: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const parsed = projectNameSchema.safeParse(formData.get('name'));

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'That name will not do',
    };
  }

  let project: CreatedProject;
  try {
    project = await createProject(parsed.data);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;

    // The unreachable message names OBSERVE_API_URL — an internal address the
    // browser has no business learning. Same rule as the events route handler.
    if (error.isUnreachable) {
      console.error('observe API unreachable', error);
      return { status: 'error', message: 'The observe API is unavailable' };
    }

    return { status: 'error', message: error.message };
  }

  // The list is a server read, so this is the whole cache story.
  revalidatePath('/projects');

  return {
    status: 'created',
    project,
    installSnippet: installSnippet(project.apiKey),
  };
}
