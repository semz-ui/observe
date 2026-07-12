import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import type { CreateProjectResult } from '../../application/use-cases/create-project.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import type { ProjectSummary } from '../../application/use-cases/list-projects.use-case';
import { CreateProjectDto } from '../dtos/create-project.dto';

@Controller('api/projects')
export class ProjectsController {
  constructor(
    private readonly createProject: CreateProjectUseCase,
    private readonly listProjects: ListProjectsUseCase,
  ) {}

  // 201 with the plaintext key — the only time it is ever shown.
  @Post()
  create(@Body() dto: CreateProjectDto): Promise<CreateProjectResult> {
    return this.createProject.execute(dto.name);
  }

  @Get()
  list(): Promise<ProjectSummary[]> {
    return this.listProjects.execute();
  }
}
