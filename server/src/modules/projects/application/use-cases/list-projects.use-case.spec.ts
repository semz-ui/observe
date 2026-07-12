import { CreateProjectUseCase } from './create-project.use-case';
import { ListProjectsUseCase } from './list-projects.use-case';
import { InMemoryProjectRepository } from '../../testing/in-memory-project.repository';

describe('ListProjectsUseCase', () => {
  let repository: InMemoryProjectRepository;
  let useCase: ListProjectsUseCase;

  beforeEach(() => {
    repository = new InMemoryProjectRepository();
    useCase = new ListProjectsUseCase(repository);
  });

  it('returns an empty list when no projects exist', async () => {
    await expect(useCase.execute()).resolves.toEqual([]);
  });

  it('returns stored projects without any key material', async () => {
    const create = new CreateProjectUseCase(repository);
    const created = await create.execute('my site');

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: created.id,
      name: 'my site',
      createdAt: created.createdAt,
    });
    expect(result[0]).not.toHaveProperty('apiKey');
    expect(result[0]).not.toHaveProperty('apiKeyHash');
  });
});
