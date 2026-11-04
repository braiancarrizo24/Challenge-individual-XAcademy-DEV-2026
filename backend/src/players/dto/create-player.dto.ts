import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PlayerSkillDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  skill: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99)
  value: number;
}

class InitialEditionDto {
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
  @Type(() => String)
  @IsString()
  valueEur?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  wageEur?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerSkillDto)
  skills: PlayerSkillDto[];
}

export class CreatePlayerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsIn(['male', 'female'])
  gender: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ValidateNested()
  @Type(() => InitialEditionDto)
  edition: InitialEditionDto;
}