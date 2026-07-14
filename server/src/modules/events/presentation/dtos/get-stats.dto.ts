import { IsISO8601, IsNotEmpty, IsString } from 'class-validator';

// Query params for GET /v1/stats. No auth yet (Phase 7 adds the JWT guard and
// scopes projects to a user), so the caller names the project directly.
// from/to are validated as ISO strings and converted to Dates in the use case;
// the range is half-open [from, to).
export class GetStatsDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsISO8601()
  from!: string;

  @IsISO8601()
  to!: string;
}
