import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PlayerEditionSkillDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  skill: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  value: number;
}

export class CreatePlayerEditionDto {
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(23)
  edition: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  fifaUpdate: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  club?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  position?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99)
  rating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99)
  potential?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,19}$/)
  valueEur?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,19}$/)
  wageEur?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerEditionSkillDto)
  skills: PlayerEditionSkillDto[];
}