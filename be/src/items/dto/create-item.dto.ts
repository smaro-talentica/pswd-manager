import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ITEM_TYPES, type ItemTypeValue } from '../../templates/builtin.js';

export class CreateItemDto {
  @IsUUID()
  vaultId!: string;

  @IsIn(ITEM_TYPES)
  type!: ItemTypeValue;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsString()
  @IsNotEmpty()
  encryptedPayload!: string;

  @IsString()
  @IsNotEmpty()
  nonce!: string;

  @IsString()
  @IsNotEmpty()
  wrappedDek!: string;
}
