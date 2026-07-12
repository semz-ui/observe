import { Injectable } from '@nestjs/common';
import type { Project as ProjectRow } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import type { Project } from '../../domain/entities/project.entity';
import type {
  CreateProjectInput,
  ProjectRepository,
} from '../../domain/repositories/project.repository';

// The generated client still calls the api_key column `apiKey`; this mapper
// is the one place that name meets the domain's `apiKeyHash`.
function toDomain(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    apiKeyHash: row.apiKey,
    createdAt: row.createdAt,
  };
}

@Injectable()
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByApiKeyHash(apiKeyHash: string): Promise<Project | null> {
    const row = await this.prisma.project.findUnique({
      where: { apiKey: apiKeyHash },
    });
    return row ? toDomain(row) : null;
  }

  async findAll(): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDomain);
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const row = await this.prisma.project.create({
      data: { name: input.name, apiKey: input.apiKeyHash },
    });
    return toDomain(row);
  }
}
