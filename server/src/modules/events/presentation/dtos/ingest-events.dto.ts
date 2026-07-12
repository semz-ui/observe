import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

// No projectId field: the API key is the identity — the use case stamps the
// resolved project id and ignores anything the client might claim.
// Every string is length-capped: this endpoint is public, so without caps a
// single 100-event batch could carry multi-megabyte strings into storage.
export class ClickEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  anonymousId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  sessionId!: string;

  // require_tld: false so localhost demo pages validate
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  pageTitle?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  elementTag!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  elementId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  elementText?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  elementSelector!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  elementHref?: string;

  // validated as an ISO string; converted to Date in the use case
  @IsISO8601()
  timestamp!: string;
}

export class IngestEventsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  apiKey!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  // ValidateNested recurses into items; Type tells class-transformer which
  // class to instantiate — without it items stay plain objects and their
  // decorators silently never run
  @ValidateNested({ each: true })
  @Type(() => ClickEventDto)
  events!: ClickEventDto[];
}
