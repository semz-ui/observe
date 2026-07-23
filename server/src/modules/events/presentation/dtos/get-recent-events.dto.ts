import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

// Query params for GET /v1/events/recent. No auth yet (Phase 7 adds the JWT
// guard and scopes projects to a user), so the caller names the project
// directly. Pagination is keyset on `id`: omit `cursor` for the first page,
// then pass back the `nextCursor` from the previous response.
export class GetRecentEventsDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  // query params arrive as strings; Type coerces before the numeric checks run
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  // event ids are uuid v7; class-validator's named versions don't include '7',
  // so 'all' accepts a v7 string while still rejecting a garbage cursor (400)
  // rather than letting it fall through to a silent full scan
  @IsOptional()
  @IsUUID('all')
  cursor?: string;
}
