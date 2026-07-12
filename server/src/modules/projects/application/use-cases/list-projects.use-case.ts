import { Inject, Injectable } from '@nestjs/common';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import type { ProjectRepository } from '../../domain/repositories/project.repository';

// No key field: hashes are useless to clients and plaintext is unrecoverable.
export interface ProjectSummary {
  id: string;
  name: string;
  createdAt: Date;
}

@Injectable()
export class ListProjectsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(): Promise<ProjectSummary[]> {
    const projects = await this.projectRepository.findAll();
    return projects.map(({ id, name, createdAt }) => ({
      id,
      name,
      createdAt,
    }));
  }
}
