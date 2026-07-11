# Server architecture — modular monolith + clean architecture (NestJS)

Two ideas layered together:

1. **Modular monolith** — one deployable app, but the code is split into
   feature modules (`health`, `projects`, `events`) that behave like
   mini-applications. Modules talk to each other only through their public
   NestJS module surface, never by reaching into each other's internals.
2. **Clean architecture** — *inside* each module, code is layered, and
   **dependencies only point inward**:

```
presentation ──▶ application ──▶ domain ◀── (implemented by) infrastructure
   (HTTP)         (use cases)    (core)          (DB, external services)
```

## Layout

```
src/
├── modules/
│   ├── health/                  # working example slice
│   │   ├── application/use-cases/check-health.use-case.ts
│   │   ├── presentation/controllers/health.controller.ts
│   │   └── health.module.ts     # the module's public wiring
│   ├── projects/                # project + API key management
│   │   ├── domain/entities/         # Project entity
│   │   ├── domain/repositories/     # ProjectRepository interface (port)
│   │   ├── application/use-cases/   # CreateProject, ...
│   │   ├── infrastructure/persistence/  # PostgresProjectRepository (adapter)
│   │   ├── presentation/controllers/
│   │   └── projects.module.ts
│   └── events/                  # click-event ingestion + queries
│       └── (same layer layout)
├── shared/                      # cross-cutting infra: DB connection, config
├── app.module.ts                # composition root: imports feature modules
└── main.ts
```

## The layers (inside a module)

- **`domain`** — plain TypeScript, no framework imports. Entities
  (`Project`, `ClickEvent`) and repository *interfaces* (ports): the domain
  declares *what* persistence must do, never *how*.
- **`application`** — one class per use case (`IngestEventsUseCase`,
  `CreateProjectUseCase`). Orchestrates entities via repository interfaces;
  doesn't know whether storage is Postgres or an in-memory array — which is
  what makes it unit-testable.
- **`infrastructure`** — the adapters: DB code, e.g.
  `PostgresProjectRepository implements ProjectRepository`. Swapping databases
  rewrites only this layer.
- **`presentation`** — controllers + request DTOs. Translate HTTP ⇄ use case;
  no business logic, ever.

## Wiring

Each feature gets a `<name>.module.ts` where Nest's dependency injection
binds ports to adapters:

```ts
@Module({
  controllers: [ProjectsController],
  providers: [
    CreateProjectUseCase,
    { provide: 'ProjectRepository', useClass: PostgresProjectRepository },
  ],
})
export class ProjectsModule {}
```

The use case asks for `'ProjectRepository'` (the interface); the module
decides which implementation it receives — tests can bind an in-memory fake
instead. `app.module.ts` stays tiny: it just imports the feature modules.

## Module boundaries

If `events` ever needs something from `projects` (e.g. "look up a project by
API key"), it should go through a provider that `projects.module.ts`
**exports** — not import a class from deep inside `projects/`'s folders. This
discipline is what would let a module be broken out into its own service
later without surgery.
