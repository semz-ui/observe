import type { ClickEvent } from '../../domain/entities/click-event.entity';
import type {
  EventFeedRepository,
  RecentEventsPage,
  RecentEventsQuery,
} from '../../domain/repositories/event-feed.repository';
import { GetRecentEventsUseCase } from './get-recent-events.use-case';

// Records the query it was called with and returns a canned page, so the tests
// can assert what the use case forwards to the read port.
class FakeEventFeedRepository implements EventFeedRepository {
  lastQuery?: RecentEventsQuery;

  constructor(private readonly page: RecentEventsPage) {}

  recentEvents(query: RecentEventsQuery): Promise<RecentEventsPage> {
    this.lastQuery = query;
    return Promise.resolve(this.page);
  }
}

function makeEvent(id: string): ClickEvent {
  return {
    id,
    projectId: 'project-1',
    anonymousId: 'anon-1',
    sessionId: 'sess-1',
    url: 'http://localhost/pricing',
    elementTag: 'button',
    elementSelector: '#buy-now',
    timestamp: new Date('2026-07-12T12:00:00.000Z'),
  };
}

describe('GetRecentEventsUseCase', () => {
  it('defaults the limit to 50 when the caller omits it', async () => {
    const repository = new FakeEventFeedRepository({
      events: [],
      nextCursor: null,
    });
    const useCase = new GetRecentEventsUseCase(repository);

    await useCase.execute({ projectId: 'project-1' });

    expect(repository.lastQuery?.limit).toBe(50);
  });

  it('forwards an explicit limit and cursor unchanged', async () => {
    const repository = new FakeEventFeedRepository({
      events: [],
      nextCursor: null,
    });
    const useCase = new GetRecentEventsUseCase(repository);

    await useCase.execute({
      projectId: 'project-1',
      limit: 10,
      cursor: 'cursor-id',
    });

    expect(repository.lastQuery).toEqual({
      projectId: 'project-1',
      limit: 10,
      cursor: 'cursor-id',
    });
  });

  it('returns the page from the repository', async () => {
    const page: RecentEventsPage = {
      events: [makeEvent('evt-2'), makeEvent('evt-1')],
      nextCursor: 'evt-1',
    };
    const useCase = new GetRecentEventsUseCase(
      new FakeEventFeedRepository(page),
    );

    await expect(useCase.execute({ projectId: 'project-1' })).resolves.toEqual(
      page,
    );
  });
});
