// The module's public surface. Everything outside `modules/projects/` imports
// from here — never from a folder inside it.
export type { ProjectSummary } from './domain/project';
export { findProject, listProjects } from './infrastructure/projects.api';
export { ProjectSwitcherSlot } from './presentation/project-switcher-slot';
export { ProjectsEmptyState } from './presentation/projects-empty-state';
export { ProjectsList } from './presentation/projects-list';
