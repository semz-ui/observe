import { Inject, Injectable } from '@nestjs/common';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import { hashApiKey } from '../../domain/services/api-key';
import type { ProjectLookup } from '../ports/project-lookup';

@Injectable()
export class ProjectLookupService implements ProjectLookup {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async findProjectIdByApiKey(apiKey: string): Promise<string | null> {
    const project = await this.projectRepository.findByApiKeyHash(
      hashApiKey(apiKey),
    );
    return project?.id ?? null;
  }
}
