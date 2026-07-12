// The projects module's public surface. Other modules import ONLY from
// here — anything not re-exported is private to this module.
export { PROJECT_LOOKUP } from './application/ports/project-lookup';
export type { ProjectLookup } from './application/ports/project-lookup';
export { ProjectsModule } from './projects.module';
