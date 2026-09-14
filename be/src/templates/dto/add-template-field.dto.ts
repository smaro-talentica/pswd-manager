import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { FIELD_INPUTS } from '../builtin.js';

export class AddTemplateFieldDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label!: string;

  @IsOptional()
  @IsIn(FIELD_INPUTS)
  input?: (typeof FIELD_INPUTS)[number];
}
