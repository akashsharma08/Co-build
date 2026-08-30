import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @ApiPropertyOptional({
    description: 'Required when the account has a local password',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  currentPassword?: string;
}
