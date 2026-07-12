import { Inject, Injectable } from '@nestjs/common';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import { generateApiKey, hashApiKey } from '../../domain/services/api-key';

// The only place a plaintext key ever appears — it is unrecoverable afterwards.
export interface CreateProjectResult {
  id: string;
  name: string;
  apiKey: string;
  createdAt: Date;
}

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(name: string): Promise<CreateProjectResult> {
    const apiKey = generateApiKey();
    const project = await this.projectRepository.create({
      name,
      apiKeyHash: hashApiKey(apiKey),
    });
    return {
      id: project.id,
      name: project.name,
      apiKey,
      createdAt: project.createdAt,
    };
  }
}
