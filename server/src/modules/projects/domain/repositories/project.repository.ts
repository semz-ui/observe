import { Project } from '../entities/project.entity';

export const PROJECT_REPOSITORY = Symbol('ProjectRepository');

export interface ProjectRepository {
  findByApiKey(apiKey: string): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  create(project: Project): Promise<Project>;
}
