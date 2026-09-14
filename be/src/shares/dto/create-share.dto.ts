import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateShareDto {
  @IsUUID()
  itemId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  wrappedKey!: string;
}
