import { randomUUID } from 'node:crypto';
import type { Project } from '../domain/entities/project.entity';
import type {
  CreateProjectInput,
  ProjectRepository,
} from '../domain/repositories/project.repository';

// Test fake: real (simplified) behavior backed by an array, mimicking what
// the Prisma implementation does — including filling id/createdAt on create.
export class InMemoryProjectRepository implements ProjectRepository {
  readonly projects: Project[] = [];

  findByApiKeyHash(apiKeyHash: string): Promise<Project | null> {
    return Promise.resolve(
      this.projects.find((p) => p.apiKeyHash === apiKeyHash) ?? null,
    );
  }

  findAll(): Promise<Project[]> {
    return Promise.resolve([...this.projects]);
  }

  create(input: CreateProjectInput): Promise<Project> {
    const project: Project = {
      id: randomUUID(),
      createdAt: new Date(),
      ...input,
    };
    this.projects.push(project);
    return Promise.resolve(project);
  }
}
