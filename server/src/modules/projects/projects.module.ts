import { Module } from '@nestjs/common';
import { PROJECT_REPOSITORY } from './domain/repositories/project.repository';
import { PROJECT_LOOKUP } from './application/ports/project-lookup';
import { ProjectLookupService } from './application/services/project-lookup.service';
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case';
import { ListProjectsUseCase } from './application/use-cases/list-projects.use-case';
import { PrismaProjectRepository } from './infrastructure/persistence/prisma-project.repository';
import { ProjectsController } from './presentation/controllers/projects.controller';

@Module({
  controllers: [ProjectsController],
  providers: [
    // interfaces erase at runtime, so the Symbol token carries the binding
    { provide: PROJECT_REPOSITORY, useClass: PrismaProjectRepository },
    { provide: PROJECT_LOOKUP, useClass: ProjectLookupService },
    CreateProjectUseCase,
    ListProjectsUseCase,
  ],
  // the module's cross-module surface: events resolves api keys through this
  exports: [PROJECT_LOOKUP],
})
export class ProjectsModule {}
