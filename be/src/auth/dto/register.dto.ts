import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MESSAGE, PASSWORD_MIN_LENGTH, PASSWORD_PATTERN } from '../password-policy.js';

export class KdfParamsDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  hash!: string;

  @IsInt()
  @Min(1)
  iterations!: number;

  @IsInt()
  @Min(128)
  length!: number;
}

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password!: string;

  @IsString()
  @IsNotEmpty()
  kdfSalt!: string;

  @ValidateNested()
  @Type(() => KdfParamsDto)
  kdfParams!: KdfParamsDto;

  @IsString()
  @IsNotEmpty()
  publicKey!: string;

  @IsString()
  @IsNotEmpty()
  encryptedPrivateKey!: string;

  @IsString()
  @IsNotEmpty()
  encryptedDek!: string;
}
