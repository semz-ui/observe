import type { CreatedProject } from '../domain/project';

/**
 * Lives here rather than beside the action because a `'use server'` file may
 * export *only* async functions — an exported object throws at module
 * evaluation, which typecheck and build both wave through.
 */
export interface CreateProjectState {
  readonly status: 'idle' | 'error' | 'created';
  readonly message?: string;
  readonly project?: CreatedProject;
  /** Built server-side, because the key never reaches this app again. */
  readonly installSnippet?: string;
}

export const INITIAL_CREATE_STATE: CreateProjectState = { status: 'idle' };
