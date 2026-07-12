import { Project } from '../entities/project.entity';

export const PROJECT_REPOSITORY = Symbol('ProjectRepository');

// id and createdAt are filled in by the persistence layer (uuid v7 / now()).
export type CreateProjectInput = Omit<Project, 'id' | 'createdAt'>;

export interface ProjectRepository {
  // Callers hash the plaintext key (hashApiKey) before looking it up.
  findByApiKeyHash(apiKeyHash: string): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  create(input: CreateProjectInput): Promise<Project>;
}
