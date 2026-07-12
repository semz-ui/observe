import { Module } from '@nestjs/common';
import { PROJECT_REPOSITORY } from './domain/repositories/project.repository';
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case';
import { ListProjectsUseCase } from './application/use-cases/list-projects.use-case';
import { PrismaProjectRepository } from './infrastructure/persistence/prisma-project.repository';
import { ProjectsController } from './presentation/controllers/projects.controller';

@Module({
  controllers: [ProjectsController],
  providers: [
    // interfaces erase at runtime, so the Symbol token carries the binding
    { provide: PROJECT_REPOSITORY, useClass: PrismaProjectRepository },
    CreateProjectUseCase,
    ListProjectsUseCase,
  ],
})
export class ProjectsModule {}
