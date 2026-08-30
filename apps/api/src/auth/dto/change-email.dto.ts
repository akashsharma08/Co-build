import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ChangeEmailDto {
  @ApiProperty({ example: 'new@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Current password for confirmation' })
  @IsString()
  @MinLength(8)
  currentPassword!: string;
}
