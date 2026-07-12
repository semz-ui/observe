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
export class ClickEventDto {
  @IsString()
  @IsNotEmpty()
  anonymousId!: string;

  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  // require_tld: false so localhost demo pages validate
  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  @IsString()
  pageTitle?: string;

  @IsString()
  @IsNotEmpty()
  elementTag!: string;

  @IsOptional()
  @IsString()
  elementId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  elementText?: string;

  @IsString()
  @IsNotEmpty()
  elementSelector!: string;

  @IsOptional()
  @IsString()
  elementHref?: string;

  // validated as an ISO string; converted to Date in the use case
  @IsISO8601()
  timestamp!: string;
}

export class IngestEventsDto {
  @IsString()
  @IsNotEmpty()
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
