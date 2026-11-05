
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

class UpdateEditionSkillDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, {
    message: 'La habilidad no puede contener solamente espacios.',
  })
  @MaxLength(80)
  skill: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  value: number;
}

export class UpdatePlayerEditionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(23)
  edition?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fifaUpdate?: number;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateEditionSkillDto)
  skills?: UpdateEditionSkillDto[];
}
