import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { FIELD_INPUTS } from '../builtin.js';

export class TemplateFieldInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label!: string;

  @IsOptional()
  @IsIn(FIELD_INPUTS)
  input?: (typeof FIELD_INPUTS)[number];
}

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TemplateFieldInputDto)
  fields!: TemplateFieldInputDto[];
}
