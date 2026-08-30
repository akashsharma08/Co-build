import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Alex Morgan' })
  @IsString()
  @Length(2, 100)
  displayName!: string;

  @ApiProperty({ example: 'alex_morgan' })
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/, {
    message:
      'username must contain lowercase letters, numbers, underscores, or hyphens',
  })
  username!: string;
}
