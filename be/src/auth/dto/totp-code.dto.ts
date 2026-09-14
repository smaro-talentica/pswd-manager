import { Matches } from 'class-validator';

export class TotpCodeDto {
  @Matches(/^\d{6}$/)
  code!: string;
}
